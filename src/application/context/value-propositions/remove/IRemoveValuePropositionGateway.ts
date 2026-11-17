import { RemoveValuePropositionRequest } from "./RemoveValuePropositionRequest.js";
import { RemoveValuePropositionResponse } from "./RemoveValuePropositionResponse.js";

export interface IRemoveValuePropositionGateway {
  removeValueProposition(
    request: RemoveValuePropositionRequest,
  ): Promise<RemoveValuePropositionResponse>;
}
