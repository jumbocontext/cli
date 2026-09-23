import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/** Emitted when a defined goal is removed from automatic work selection. */
export interface GoalPostponedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.POSTPONED;
  readonly payload: {
    readonly status: GoalStatusType;
  };
}
