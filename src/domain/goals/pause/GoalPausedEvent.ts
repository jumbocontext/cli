import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";
import { GoalPausedReasonsType } from "../GoalPausedReasons.js";

/**
 * Emitted when a goal is paused.
 * Transitions goal status to 'paused'.
 * Captures the reason and optional note for pausing.
 */
export interface GoalPausedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.PAUSED;
  readonly payload: {
    readonly status: GoalStatusType; // Will be 'paused'
    readonly reason: GoalPausedReasonsType; // Reason for pausing
    readonly note?: string; // Optional additional context
  };
}
