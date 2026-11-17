import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is blocked.
 * Transitions goal status from 'to-do' or 'doing' to 'blocked'.
 * Captures the reason for blocking in the note field.
 */
export interface GoalBlockedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.BLOCKED;
  readonly payload: {
    readonly status: GoalStatusType; // Will be 'blocked'
    readonly note: string; // Reason for blocking
  };
}
