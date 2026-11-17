import { ReverseDecisionRequest } from "./ReverseDecisionRequest.js";
import { ReverseDecisionResponse } from "./ReverseDecisionResponse.js";

export interface IReverseDecisionGateway {
  reverseDecision(
    request: ReverseDecisionRequest,
  ): Promise<ReverseDecisionResponse>;
}
