import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is refined after creation.
 * Transitions goal status from 'to-do' to 'refined'.
 * Marks the goal as ready to be started.
 */
export interface GoalRefinedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.REFINED;
  readonly payload: {
    readonly status: GoalStatusType; // Will be 'refined'
    readonly refinedAt: string; // ISO 8601 timestamp when refined
  };
}
