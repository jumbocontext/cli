import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is closed after codification is complete.
 * Transitions goal status from 'codifying' to 'done'.
 * Releases the claim held during codification.
 */
export interface GoalClosedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.CLOSED;
  readonly payload: {
    readonly status: GoalStatusType; // 'done'
    readonly closedAt: string; // ISO 8601 timestamp
  };
}
