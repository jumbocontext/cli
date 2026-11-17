import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal fails QA review and is rejected.
 * Transitions goal status from "in-review" to "rejected".
 * Records review issues describing the implementation problems that need fixing.
 * Releases the reviewer's claim so the implementing agent can rework.
 */
export interface GoalRejectedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.REJECTED;
  readonly payload: {
    readonly status: GoalStatusType; // Will be 'rejected'
    readonly rejectedAt: string; // ISO 8601 timestamp when rejected
    readonly reviewIssues: string; // Description of implementation problems
    /** @deprecated Legacy field from persisted events. Use reviewIssues instead. */
    readonly auditFindings?: string;
  };
}
