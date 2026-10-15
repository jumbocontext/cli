import type { BaseEvent } from "../../BaseEvent.js";
import { DecisionStatus } from "../Constants.js";

/** Irreversible removal; the decision's historical data remains intact. */
export interface DecisionRemovedEvent extends BaseEvent {
  readonly payload: {
    readonly status: typeof DecisionStatus.REMOVED;
  };
}
