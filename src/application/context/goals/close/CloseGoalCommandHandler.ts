import { CloseGoalCommand } from "./CloseGoalCommand.js";
import { IGoalClosedEventWriter } from "./IGoalClosedEventWriter.js";
import { IGoalClosedEventReader } from "./IGoalClosedEventReader.js";
import { IGoalCloseReader } from "./IGoalCloseReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import {
  GoalErrorMessages,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { GoalContextQueryHandler } from "../get/GoalContextQueryHandler.js";
import { ContextualGoalView } from "../get/ContextualGoalView.js";

/**
 * Handles closing a goal after codification is complete.
 * Loads aggregate from event history, calls domain logic, persists event.
 * Releases goal claims on successful close.
 * Returns ContextualGoalView for presentation layer.
 */
export class CloseGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalClosedEventWriter,
    private readonly eventReader: IGoalClosedEventReader,
    private readonly goalReader: IGoalCloseReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly goalContextQueryHandler: GoalContextQueryHandler,
  ) {}

  async execute(command: CloseGoalCommand): Promise<ContextualGoalView> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, {
          id: command.goalId,
        }),
      );
    }

    // 2. Validate claim ownership - only the claimant can close a goal
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

    // 4. Domain logic produces event (validates state)
    const event = goal.close();

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Release claim after successful close
    this.claimPolicy.releaseClaim(command.goalId);

    // 7. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 8. Query goal context
    return this.goalContextQueryHandler.execute(command.goalId);
  }
}
