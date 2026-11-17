import { GetValuePropositionsRequest } from "./GetValuePropositionsRequest.js";
import { GetValuePropositionsResponse } from "./GetValuePropositionsResponse.js";
import { IGetValuePropositionsGateway } from "./IGetValuePropositionsGateway.js";

export class GetValuePropositionsController {
  constructor(private readonly gateway: IGetValuePropositionsGateway) {}

  async handle(
    request: GetValuePropositionsRequest,
  ): Promise<GetValuePropositionsResponse> {
    return this.gateway.getValuePropositions(request);
  }
}
