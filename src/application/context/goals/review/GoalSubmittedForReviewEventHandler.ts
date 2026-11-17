import { IEventHandler } from "../../../messaging/IEventHandler.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";
import { GoalSubmittedForReviewEvent } from "../../../../domain/goals/review/GoalSubmittedForReviewEvent.js";
import { IGoalSubmittedForReviewProjector } from "./IGoalSubmittedForReviewProjector.js";

/**
 * Event handler for GoalSubmittedForReviewEvent.
 *
 * Application layer handler that orchestrates projection updates
 * when a goal is submitted for review. Subscribes to GoalSubmittedForReviewEvent via event bus.
 */
export class GoalSubmittedForReviewEventHandler implements IEventHandler {
  constructor(private readonly projector: IGoalSubmittedForReviewProjector) {}

  async handle(event: BaseEvent): Promise<void> {
    const goalSubmittedForReviewEvent = event as GoalSubmittedForReviewEvent;
    await this.projector.applyGoalSubmittedForReview(
      goalSubmittedForReviewEvent,
    );
  }
}
