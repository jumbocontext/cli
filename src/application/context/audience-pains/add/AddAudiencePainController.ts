import { AddAudiencePainRequest } from "./AddAudiencePainRequest.js";
import { AddAudiencePainResponse } from "./AddAudiencePainResponse.js";
import { IAddAudiencePainGateway } from "./IAddAudiencePainGateway.js";

export class AddAudiencePainController {
  constructor(private readonly gateway: IAddAudiencePainGateway) {}

  async handle(
    request: AddAudiencePainRequest,
  ): Promise<AddAudiencePainResponse> {
    return this.gateway.addAudiencePain(request);
  }
}
