import { UpdateInvariantRequest } from "./UpdateInvariantRequest.js";
import { UpdateInvariantResponse } from "./UpdateInvariantResponse.js";

export interface IUpdateInvariantGateway {
  updateInvariant(
    request: UpdateInvariantRequest,
  ): Promise<UpdateInvariantResponse>;
}
