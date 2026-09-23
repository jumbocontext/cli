import { BaseEvent } from "../../BaseEvent.js";
import { GoalStatusType } from "../Constants.js";

/** Emitted when a postponed goal returns to the defined backlog. */
export interface GoalReinstatedEvent extends BaseEvent {
  readonly payload: {
    readonly status: GoalStatusType;
  };
}
