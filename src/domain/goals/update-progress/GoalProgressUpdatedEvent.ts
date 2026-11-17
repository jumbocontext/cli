import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType } from "../Constants.js";

/**
 * Emitted when progress is recorded on a goal.
 * Appends a task description to the goal's progress array.
 * Progress is append-only within a goal.
 */
export interface GoalProgressUpdatedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.PROGRESS_UPDATED;
  readonly payload: {
    readonly taskDescription: string; // Description of completed sub-task
  };
}
