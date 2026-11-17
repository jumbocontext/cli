import { RestoreDecisionRequest } from "./RestoreDecisionRequest.js";
import { RestoreDecisionResponse } from "./RestoreDecisionResponse.js";

export interface IRestoreDecisionGateway {
  restoreDecision(
    request: RestoreDecisionRequest,
  ): Promise<RestoreDecisionResponse>;
}
