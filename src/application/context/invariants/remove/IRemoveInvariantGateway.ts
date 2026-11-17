import { RemoveInvariantRequest } from "./RemoveInvariantRequest.js";
import { RemoveInvariantResponse } from "./RemoveInvariantResponse.js";

export interface IRemoveInvariantGateway {
  removeInvariant(
    request: RemoveInvariantRequest,
  ): Promise<RemoveInvariantResponse>;
}
