import { RemoveAudienceRequest } from "./RemoveAudienceRequest.js";
import { RemoveAudienceResponse } from "./RemoveAudienceResponse.js";
import { IRemoveAudienceGateway } from "./IRemoveAudienceGateway.js";

export class RemoveAudienceController {
  constructor(private readonly gateway: IRemoveAudienceGateway) {}

  async handle(
    request: RemoveAudienceRequest,
  ): Promise<RemoveAudienceResponse> {
    return this.gateway.removeAudience(request);
  }
}
