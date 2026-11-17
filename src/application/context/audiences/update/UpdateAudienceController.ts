import { UpdateAudienceRequest } from "./UpdateAudienceRequest.js";
import { UpdateAudienceResponse } from "./UpdateAudienceResponse.js";
import { IUpdateAudienceGateway } from "./IUpdateAudienceGateway.js";

export class UpdateAudienceController {
  constructor(private readonly gateway: IUpdateAudienceGateway) {}

  async handle(
    request: UpdateAudienceRequest,
  ): Promise<UpdateAudienceResponse> {
    return this.gateway.updateAudience(request);
  }
}
