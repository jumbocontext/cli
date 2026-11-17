import { GetDecisionsRequest } from "./GetDecisionsRequest.js";
import { GetDecisionsResponse } from "./GetDecisionsResponse.js";
import { IGetDecisionsGateway } from "./IGetDecisionsGateway.js";

export class GetDecisionsController {
  constructor(private readonly gateway: IGetDecisionsGateway) {}

  async handle(request: GetDecisionsRequest): Promise<GetDecisionsResponse> {
    return this.gateway.getDecisions(request);
  }
}
