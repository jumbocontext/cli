import { GetValuePropositionsRequest } from "./GetValuePropositionsRequest.js";
import { GetValuePropositionsResponse } from "./GetValuePropositionsResponse.js";

export interface IGetValuePropositionsGateway {
  getValuePropositions(
    request: GetValuePropositionsRequest,
  ): Promise<GetValuePropositionsResponse>;
}
