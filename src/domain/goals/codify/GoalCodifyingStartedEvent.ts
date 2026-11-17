import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when the codify phase begins on a goal.
 * Transitions goal status from 'qualified' to 'codifying'.
 * Includes claim information for the worker performing codification.
 */
export interface GoalCodifyingStartedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.CODIFYING_STARTED;
  readonly payload: {
    readonly status: GoalStatusType; // 'codifying'
    readonly codifyStartedAt: string; // ISO 8601 timestamp
    readonly claimedBy: string; // WorkerId of the claiming worker
    readonly claimedAt: string; // ISO 8601 timestamp when claim was created
    readonly claimExpiresAt: string; // ISO 8601 timestamp when claim expires
  };
}
