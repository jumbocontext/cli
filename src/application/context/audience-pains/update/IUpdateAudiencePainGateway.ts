import { UpdateAudiencePainRequest } from "./UpdateAudiencePainRequest.js";
import { UpdateAudiencePainResponse } from "./UpdateAudiencePainResponse.js";

export interface IUpdateAudiencePainGateway {
  updateAudiencePain(
    request: UpdateAudiencePainRequest,
  ): Promise<UpdateAudiencePainResponse>;
}
