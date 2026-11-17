import { UpdateValuePropositionRequest } from "./UpdateValuePropositionRequest.js";
import { UpdateValuePropositionResponse } from "./UpdateValuePropositionResponse.js";
import { IUpdateValuePropositionGateway } from "./IUpdateValuePropositionGateway.js";

export class UpdateValuePropositionController {
  constructor(private readonly gateway: IUpdateValuePropositionGateway) {}

  async handle(
    request: UpdateValuePropositionRequest,
  ): Promise<UpdateValuePropositionResponse> {
    return this.gateway.updateValueProposition(request);
  }
}
