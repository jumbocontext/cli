import { StartGoalCommand } from "./StartGoalCommand.js";
import { IGoalStartedEventWriter } from "./IGoalStartedEventWriter.js";
import { IGoalStartedEventReader } from "./IGoalStartedEventReader.js";
import { IGoalReader } from "./IGoalReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import {
  GoalErrorMessages,
  GoalStatus,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { ISettingsReader } from "../../../settings/ISettingsReader.js";
import { GoalContextQueryHandler } from "../get/GoalContextQueryHandler.js";
import { ContextualGoalView } from "../get/ContextualGoalView.js";
import {
  PrerequisitePolicy,
  PrerequisiteStatus,
} from "../../../../domain/goals/rules/PrerequisitePolicy.js";
import { GoalView } from "../GoalView.js";

/**
 * Handles starting of a defined goal.
 * Loads aggregate from event history, calls domain logic, persists event.
 * Validates and manages goal claims to prevent concurrent work.
 * Returns ContextualGoalView for presentation layer.
 */
export class StartGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalStartedEventWriter,
    private readonly eventReader: IGoalStartedEventReader,
    private readonly goalReader: IGoalReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly settingsReader: ISettingsReader,
    private readonly goalContextQueryHandler: GoalContextQueryHandler,
    private readonly prerequisitePolicy: PrerequisitePolicy,
  ) {}

  async execute(command: StartGoalCommand): Promise<ContextualGoalView> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, {
          id: command.goalId,
        }),
      );
    }

    // 2. Resolve prerequisite statuses and validate via domain policy
    const prerequisites = await this.resolvePrerequisites(view);
    const prereqResult = this.prerequisitePolicy.check(prerequisites);
    if (!prereqResult.satisfied) {
      const details = prereqResult.unsatisfied
        .map((p) => `  - "${p.objective}" (status: ${p.status})`)
        .join("\n");
      throw new Error(
        formatErrorMessage(GoalErrorMessages.PREREQUISITES_NOT_SATISFIED, {
          details,
        }),
      );
    }

    // 3. Validate and prepare claim for entry or idempotent re-entry
    const workerId = this.workerIdentityReader.workerId;
    const settings = await this.settingsReader.read();
    const claimDurationMs = settings.claims.claimDurationMinutes * 60 * 1000;
    const entryResult = this.claimPolicy.prepareEntryClaim(
      command.goalId,
      workerId,
      claimDurationMs,
    );

    if (!entryResult.allowed) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_CLAIMED_BY_ANOTHER_WORKER, {
          expiresAt: entryResult.existingClaim.claimExpiresAt,
        }),
      );
    }

    // 4. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history);

    // 5. Domain logic produces event with claim data (validates state)
    const event = goal.start({
      claimedBy: entryResult.claim.claimedBy,
      claimedAt: entryResult.claim.claimedAt,
      claimExpiresAt: entryResult.claim.claimExpiresAt,
    });

    // 6. Persist event to file store
    await this.eventWriter.append(event);

    // 7. Store claim after successful persistence
    this.claimPolicy.storeClaim(entryResult.claim);

    // 8. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 9. Query goal context
    return this.goalContextQueryHandler.execute(command.goalId);
  }

  /**
   * Resolves prerequisite goal IDs to their current statuses via projection reads.
   */
  private async resolvePrerequisites(
    goal: GoalView,
  ): Promise<PrerequisiteStatus[]> {
    const prerequisiteIds = goal.prerequisiteGoals ?? [];
    const prerequisites: PrerequisiteStatus[] = [];

    for (const prereqId of prerequisiteIds) {
      const prereqGoal = await this.goalReader.findById(prereqId);
      prerequisites.push({
        goalId: prereqId,
        objective: prereqGoal?.objective ?? "(unknown - goal not found)",
        status: prereqGoal?.status ?? GoalStatus.TODO,
      });
    }

    return prerequisites;
  }
}
