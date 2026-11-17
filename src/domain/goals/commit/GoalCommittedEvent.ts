import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal refinement is committed.
 * Transitions goal status from 'in-refinement' to 'refined'.
 * Releases the claim held during refinement.
 */
export interface GoalCommittedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.COMMITTED;
  readonly payload: {
    readonly status: GoalStatusType; // 'refined'
    readonly committedAt: string; // ISO 8601 timestamp
  };
}
