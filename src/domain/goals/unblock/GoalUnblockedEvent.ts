import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatus } from "../Constants.js";

/**
 * Emitted when a blocked goal is unblocked.
 * Transitions goal status from 'blocked' to 'unblocked' (waiting state).
 */
export interface GoalUnblockedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.UNBLOCKED;
  readonly payload: {
    readonly status: typeof GoalStatus.UNBLOCKED; // Transition to unblocked waiting state
    readonly note?: string; // Optional resolution note
  };
}
