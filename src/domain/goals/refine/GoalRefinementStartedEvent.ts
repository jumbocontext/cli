import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal refinement phase begins.
 * Transitions goal status from 'to-do' to 'in-refinement'.
 * Includes claim information for the worker performing refinement.
 */
export interface GoalRefinementStartedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.REFINEMENT_STARTED;
  readonly payload: {
    readonly status: GoalStatusType; // 'in-refinement'
    readonly refinementStartedAt: string; // ISO 8601 timestamp
    readonly claimedBy: string; // WorkerId of the claiming worker
    readonly claimedAt: string; // ISO 8601 timestamp when claim was created
    readonly claimExpiresAt: string; // ISO 8601 timestamp when claim expires
  };
}
