import { AddAudienceRequest } from "./AddAudienceRequest.js";
import { AddAudienceResponse } from "./AddAudienceResponse.js";
import { IAddAudienceGateway } from "./IAddAudienceGateway.js";

export class AddAudienceController {
  constructor(private readonly gateway: IAddAudienceGateway) {}

  async handle(request: AddAudienceRequest): Promise<AddAudienceResponse> {
    return this.gateway.addAudience(request);
  }
}
