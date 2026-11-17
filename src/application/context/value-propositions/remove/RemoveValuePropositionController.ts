import { RemoveValuePropositionRequest } from "./RemoveValuePropositionRequest.js";
import { RemoveValuePropositionResponse } from "./RemoveValuePropositionResponse.js";
import { IRemoveValuePropositionGateway } from "./IRemoveValuePropositionGateway.js";

export class RemoveValuePropositionController {
  constructor(private readonly gateway: IRemoveValuePropositionGateway) {}

  async handle(
    request: RemoveValuePropositionRequest,
  ): Promise<RemoveValuePropositionResponse> {
    return this.gateway.removeValueProposition(request);
  }
}
