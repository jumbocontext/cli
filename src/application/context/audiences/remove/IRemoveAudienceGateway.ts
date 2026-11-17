import { RemoveAudienceRequest } from "./RemoveAudienceRequest.js";
import { RemoveAudienceResponse } from "./RemoveAudienceResponse.js";

export interface IRemoveAudienceGateway {
  removeAudience(
    request: RemoveAudienceRequest,
  ): Promise<RemoveAudienceResponse>;
}
