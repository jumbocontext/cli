import { AddDecisionRequest } from "./AddDecisionRequest.js";
import { AddDecisionResponse } from "./AddDecisionResponse.js";
import { IAddDecisionGateway } from "./IAddDecisionGateway.js";

export class AddDecisionController {
  constructor(private readonly gateway: IAddDecisionGateway) {}

  async handle(request: AddDecisionRequest): Promise<AddDecisionResponse> {
    return this.gateway.addDecision(request);
  }
}
