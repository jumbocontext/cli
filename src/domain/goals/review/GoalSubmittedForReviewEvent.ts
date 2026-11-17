import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal review begins.
 * Transitions goal status from "submitted" to "in-review".
 * Acquires a reviewer claim for the worker starting the review.
 */
export interface GoalSubmittedForReviewEvent extends BaseEvent {
  readonly type: typeof GoalEventType.SUBMITTED_FOR_REVIEW;
  readonly payload: {
    readonly status: GoalStatusType; // Will be 'in-review'
    readonly submittedAt: string; // ISO 8601 timestamp when submitted
    readonly claimedBy?: string; // Worker ID of the reviewer
    readonly claimedAt?: string; // ISO 8601 timestamp when claim acquired
    readonly claimExpiresAt?: string; // ISO 8601 timestamp when claim expires
  };
}
