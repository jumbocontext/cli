import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a defined goal is started (work begins).
 * Transitions goal status from "to-do" to "doing".
 * Includes claim information for the worker starting the goal.
 */
export interface GoalStartedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.STARTED;
  readonly payload: {
    readonly status: GoalStatusType; // "doing"
    // Claim fields - populated when worker claims the goal
    readonly claimedBy?: string; // WorkerId of the claiming worker
    readonly claimedAt?: string; // ISO 8601 timestamp when claim was created
    readonly claimExpiresAt?: string; // ISO 8601 timestamp when claim expires
  };
}
