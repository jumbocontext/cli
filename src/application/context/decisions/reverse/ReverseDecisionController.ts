import { ReverseDecisionRequest } from "./ReverseDecisionRequest.js";
import { ReverseDecisionResponse } from "./ReverseDecisionResponse.js";
import { IReverseDecisionGateway } from "./IReverseDecisionGateway.js";

export class ReverseDecisionController {
  constructor(private readonly gateway: IReverseDecisionGateway) {}

  async handle(
    request: ReverseDecisionRequest,
  ): Promise<ReverseDecisionResponse> {
    return this.gateway.reverseDecision(request);
  }
}
