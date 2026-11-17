import { GetAudiencePainsRequest } from "./GetAudiencePainsRequest.js";
import { GetAudiencePainsResponse } from "./GetAudiencePainsResponse.js";
import { IGetAudiencePainsGateway } from "./IGetAudiencePainsGateway.js";

export class GetAudiencePainsController {
  constructor(private readonly gateway: IGetAudiencePainsGateway) {}

  async handle(
    request: GetAudiencePainsRequest,
  ): Promise<GetAudiencePainsResponse> {
    return this.gateway.getAudiencePains(request);
  }
}
