import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal's work is completed and all success criteria are met.
 * Transitions goal status from 'doing' or 'blocked' to 'completed'.
 */
export interface GoalCompletedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.COMPLETED;
  readonly payload: {
    readonly status: GoalStatusType; // Will be 'completed'
  };
}
