import { GetAudiencePainsRequest } from "./GetAudiencePainsRequest.js";
import { GetAudiencePainsResponse } from "./GetAudiencePainsResponse.js";

export interface IGetAudiencePainsGateway {
  getAudiencePains(
    request: GetAudiencePainsRequest,
  ): Promise<GetAudiencePainsResponse>;
}
