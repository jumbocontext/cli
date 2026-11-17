import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * @deprecated Use GoalApprovedEvent instead. Retained for backward replay of pre-migration events.
 *
 * Emitted when a goal passes QA review and is qualified for completion.
 * Legacy events contain status: 'qualified'; migration events correct to 'approved'.
 */
export interface GoalQualifiedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.QUALIFIED;
  readonly payload: {
    readonly status: GoalStatusType; // Legacy: 'qualified'
    readonly qualifiedAt: string; // ISO 8601 timestamp when qualified
  };
}
