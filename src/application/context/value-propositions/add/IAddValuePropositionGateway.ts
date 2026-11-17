import { AddValuePropositionRequest } from "./AddValuePropositionRequest.js";
import { AddValuePropositionResponse } from "./AddValuePropositionResponse.js";

export interface IAddValuePropositionGateway {
  addValueProposition(
    request: AddValuePropositionRequest,
  ): Promise<AddValuePropositionResponse>;
}
