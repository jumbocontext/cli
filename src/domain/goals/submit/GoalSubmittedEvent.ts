import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal implementation is submitted for review.
 * Transitions goal status from 'doing' to 'submitted'.
 * Releases the implementer's claim.
 */
export interface GoalSubmittedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.SUBMITTED;
  readonly payload: {
    readonly status: GoalStatusType; // 'submitted'
    readonly submittedAt: string; // ISO 8601 timestamp
  };
}
