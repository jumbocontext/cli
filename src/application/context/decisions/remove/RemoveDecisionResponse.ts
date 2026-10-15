import { DecisionStatus } from "../../../../domain/decisions/Constants.js";

export interface RemoveDecisionResponse {
  readonly decisionId: string;
  readonly status: typeof DecisionStatus.REMOVED;
}
