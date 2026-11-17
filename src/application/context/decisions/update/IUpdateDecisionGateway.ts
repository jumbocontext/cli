import { UpdateDecisionRequest } from "./UpdateDecisionRequest.js";
import { UpdateDecisionResponse } from "./UpdateDecisionResponse.js";

export interface IUpdateDecisionGateway {
  updateDecision(
    request: UpdateDecisionRequest,
  ): Promise<UpdateDecisionResponse>;
}
