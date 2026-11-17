import { SubmitGoalForReviewCommand } from "./SubmitGoalForReviewCommand.js";
import { IGoalSubmittedForReviewEventWriter } from "./IGoalSubmittedForReviewEventWriter.js";
import { IGoalSubmittedForReviewEventReader } from "./IGoalSubmittedForReviewEventReader.js";
import { IGoalSubmitForReviewReader } from "./IGoalSubmitForReviewReader.js";
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
 * Handles starting a QA review on a submitted goal.
 * Loads aggregate from event history, calls domain logic, persists event.
 * Acquires a reviewer claim for the worker starting the review.
 * Returns ContextualGoalView for presentation layer.
 */
export class SubmitGoalForReviewCommandHandler {
  constructor(
    private readonly eventWriter: IGoalSubmittedForReviewEventWriter,
    private readonly eventReader: IGoalSubmittedForReviewEventReader,
    private readonly goalReader: IGoalSubmitForReviewReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly settingsReader: ISettingsReader,
    private readonly goalContextQueryHandler: GoalContextQueryHandler,
  ) {}

  async execute(
    command: SubmitGoalForReviewCommand,
  ): Promise<ContextualGoalView> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, {
          id: command.goalId,
        }),
      );
    }

    // 2. Validate and prepare claim for entry or idempotent re-entry
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

    // 3. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history);

    // 4. Domain logic produces event with claim data (validates state)
    const event = goal.submitForReview({
      claimedBy: entryResult.claim.claimedBy,
      claimedAt: entryResult.claim.claimedAt,
      claimExpiresAt: entryResult.claim.claimExpiresAt,
    });

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Store reviewer claim after successful persistence
    this.claimPolicy.storeClaim(entryResult.claim);

    // 7. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 8. Query goal context
    return this.goalContextQueryHandler.execute(command.goalId);
  }
}
