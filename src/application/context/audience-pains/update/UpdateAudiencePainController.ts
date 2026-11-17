import { UpdateAudiencePainRequest } from "./UpdateAudiencePainRequest.js";
import { UpdateAudiencePainResponse } from "./UpdateAudiencePainResponse.js";
import { IUpdateAudiencePainGateway } from "./IUpdateAudiencePainGateway.js";

export class UpdateAudiencePainController {
  constructor(private readonly gateway: IUpdateAudiencePainGateway) {}

  async handle(
    request: UpdateAudiencePainRequest,
  ): Promise<UpdateAudiencePainResponse> {
    return this.gateway.updateAudiencePain(request);
  }
}
