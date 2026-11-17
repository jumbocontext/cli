import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal passes QA review and is approved for codification.
 * Transitions goal status from "in-review" to "approved".
 * Replaces GoalQualifiedEvent for forward use; GoalQualifiedEvent is retained for backward replay.
 */
export interface GoalApprovedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.APPROVED;
  readonly payload: {
    readonly status: GoalStatusType; // Will be 'approved'
    readonly approvedAt: string; // ISO 8601 timestamp when approved
  };
}
