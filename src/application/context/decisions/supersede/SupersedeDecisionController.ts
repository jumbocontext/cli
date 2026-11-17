import { SupersedeDecisionRequest } from "./SupersedeDecisionRequest.js";
import { SupersedeDecisionResponse } from "./SupersedeDecisionResponse.js";
import { ISupersedeDecisionGateway } from "./ISupersedeDecisionGateway.js";

export class SupersedeDecisionController {
  constructor(private readonly gateway: ISupersedeDecisionGateway) {}

  async handle(
    request: SupersedeDecisionRequest,
  ): Promise<SupersedeDecisionResponse> {
    return this.gateway.supersedeDecision(request);
  }
}
