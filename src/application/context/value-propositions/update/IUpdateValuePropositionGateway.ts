import { UpdateValuePropositionRequest } from "./UpdateValuePropositionRequest.js";
import { UpdateValuePropositionResponse } from "./UpdateValuePropositionResponse.js";

export interface IUpdateValuePropositionGateway {
  updateValueProposition(
    request: UpdateValuePropositionRequest,
  ): Promise<UpdateValuePropositionResponse>;
}
