import { IGetInvariantsGateway } from "./IGetInvariantsGateway.js";
import { GetInvariantRequest } from "./GetInvariantRequest.js";
import { GetInvariantResponse } from "./GetInvariantResponse.js";
import { GetInvariantsRequest } from "./GetInvariantsRequest.js";
import { GetInvariantsResponse } from "./GetInvariantsResponse.js";
import { GetAllInvariantsRequest } from "./GetAllInvariantsRequest.js";
import { GetAllInvariantsResponse } from "./GetAllInvariantsResponse.js";

export class GetInvariantsController {
  constructor(private readonly gateway: IGetInvariantsGateway) {}

  async getInvariant(
    request: GetInvariantRequest,
  ): Promise<GetInvariantResponse> {
    return this.gateway.getInvariant(request);
  }

  async getInvariants(
    request: GetInvariantsRequest,
  ): Promise<GetInvariantsResponse> {
    return this.gateway.getInvariants(request);
  }

  async getAllInvariants(
    request: GetAllInvariantsRequest,
  ): Promise<GetAllInvariantsResponse> {
    return this.gateway.getAllInvariants(request);
  }
}
