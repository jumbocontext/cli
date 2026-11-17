import { UpdateAudienceRequest } from "./UpdateAudienceRequest.js";
import { UpdateAudienceResponse } from "./UpdateAudienceResponse.js";

export interface IUpdateAudienceGateway {
  updateAudience(
    request: UpdateAudienceRequest,
  ): Promise<UpdateAudienceResponse>;
}
