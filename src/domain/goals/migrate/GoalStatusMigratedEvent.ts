import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted by the idempotent migration patch to rename legacy status values.
 * Applied during event replay to correct final projected state.
 *
 * Migrations:
 *   'to-do'     → 'defined'
 *   'qualified'  → 'approved'
 *   'completed'  → 'done'
 */
export interface GoalStatusMigratedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.STATUS_MIGRATED;
  readonly payload: {
    readonly fromStatus: string; // Legacy status value (e.g. 'to-do')
    readonly toStatus: GoalStatusType; // New status value (e.g. 'defined')
    readonly status: GoalStatusType; // Current status after migration
    readonly migratedAt: string; // ISO 8601 timestamp
  };
}
