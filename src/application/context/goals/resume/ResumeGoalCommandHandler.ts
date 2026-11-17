import { ResumeGoalCommand } from "./ResumeGoalCommand.js";
import { IGoalResumedEventWriter } from "./IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "./IGoalResumedEventReader.js";
import { IGoalReader } from "./IGoalReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import {
  GoalErrorMessages,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { ISettingsReader } from "../../../settings/ISettingsReader.js";
import { GoalContextQueryHandler } from "../get/GoalContextQueryHandler.js";
import { ContextualGoalView } from "../get/ContextualGoalView.js";

/**
 * Handles resuming of a paused goal.
 * Loads aggregate from event history, calls domain logic, persists event.
 * Validates and manages goal claims to prevent concurrent work.
 * Returns ContextualGoalView for presentation layer.
 */
export class ResumeGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalResumedEventWriter,
    private readonly eventReader: IGoalResumedEventReader,
    private readonly goalReader: IGoalReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly settingsReader: ISettingsReader,
    private readonly goalContextQueryHandler: GoalContextQueryHandler,
  ) {}

  async execute(command: ResumeGoalCommand): Promise<ContextualGoalView> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, {
          id: command.goalId,
        }),
      );
    }

    // 2. Validate claim policy before resuming
    const workerId = this.workerIdentityReader.workerId;
    const claimValidation = this.claimPolicy.canClaim(command.goalId, workerId);

    if (!claimValidation.allowed) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_CLAIMED_BY_ANOTHER_WORKER, {
          expiresAt: claimValidation.existingClaim.claimExpiresAt,
        }),
      );
    }

    // 3. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history);

    // 4. Prepare claim data before creating event (for embedding in event payload)
    const settings = await this.settingsReader.read();
    const claimDurationMs = settings.claims.claimDurationMinutes * 60 * 1000;
    const claim = this.claimPolicy.prepareRefreshedClaim(
      command.goalId,
      workerId,
      claimDurationMs,
    );

    // 5. Domain logic produces event with claim data (validates state)
    const event = goal.resume(command.note, {
      claimedBy: claim.claimedBy,
      claimedAt: claim.claimedAt,
      claimExpiresAt: claim.claimExpiresAt,
    });

    // 6. Persist event to file store
    await this.eventWriter.append(event);

    // 7. Store claim after successful persistence
    this.claimPolicy.storeClaim(claim);

    // 8. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 9. Query goal context
    return this.goalContextQueryHandler.execute(command.goalId);
  }
}
