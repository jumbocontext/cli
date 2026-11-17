import { AddAudiencePainRequest } from "./AddAudiencePainRequest.js";
import { AddAudiencePainResponse } from "./AddAudiencePainResponse.js";

export interface IAddAudiencePainGateway {
  addAudiencePain(
    request: AddAudiencePainRequest,
  ): Promise<AddAudiencePainResponse>;
}
