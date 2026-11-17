import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is resumed from paused status.
 * Transitions goal status from 'paused' to 'doing'.
 * Captures optional note about resumption.
 * Includes claim information for the worker resuming the goal.
 */
export interface GoalResumedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.RESUMED;
  readonly payload: {
    readonly status: GoalStatusType; // Will be 'doing'
    readonly note?: string; // Optional note about resumption
    // Claim fields - populated when worker claims the goal
    readonly claimedBy?: string; // WorkerId of the claiming worker
    readonly claimedAt?: string; // ISO 8601 timestamp when claim was created
    readonly claimExpiresAt?: string; // ISO 8601 timestamp when claim expires
  };
}
