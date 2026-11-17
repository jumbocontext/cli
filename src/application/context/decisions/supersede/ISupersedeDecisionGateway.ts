import { SupersedeDecisionRequest } from "./SupersedeDecisionRequest.js";
import { SupersedeDecisionResponse } from "./SupersedeDecisionResponse.js";

export interface ISupersedeDecisionGateway {
  supersedeDecision(
    request: SupersedeDecisionRequest,
  ): Promise<SupersedeDecisionResponse>;
}
