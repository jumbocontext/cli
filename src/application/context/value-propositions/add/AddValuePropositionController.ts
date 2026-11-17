import { AddValuePropositionRequest } from "./AddValuePropositionRequest.js";
import { AddValuePropositionResponse } from "./AddValuePropositionResponse.js";
import { IAddValuePropositionGateway } from "./IAddValuePropositionGateway.js";

export class AddValuePropositionController {
  constructor(private readonly gateway: IAddValuePropositionGateway) {}

  async handle(
    request: AddValuePropositionRequest,
  ): Promise<AddValuePropositionResponse> {
    return this.gateway.addValueProposition(request);
  }
}
