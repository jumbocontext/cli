import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is reset to its last waiting state.
 * Can transition from in-progress states and terminal states back to their
 * corresponding waiting state (e.g., DOING→REFINED, CODIFYING→APPROVED).
 */
export interface GoalResetEvent extends BaseEvent {
  readonly type: typeof GoalEventType.RESET;
  readonly payload: {
    readonly status: GoalStatusType; // Dynamic target waiting state
  };
}
