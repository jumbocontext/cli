import { UpdateDecisionRequest } from "./UpdateDecisionRequest.js";
import { UpdateDecisionResponse } from "./UpdateDecisionResponse.js";
import { IUpdateDecisionGateway } from "./IUpdateDecisionGateway.js";

export class UpdateDecisionController {
  constructor(private readonly gateway: IUpdateDecisionGateway) {}

  async handle(
    request: UpdateDecisionRequest,
  ): Promise<UpdateDecisionResponse> {
    return this.gateway.updateDecision(request);
  }
}
