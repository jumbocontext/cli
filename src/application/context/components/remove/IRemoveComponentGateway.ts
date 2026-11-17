import { RemoveComponentRequest } from "./RemoveComponentRequest.js";
import { RemoveComponentResponse } from "./RemoveComponentResponse.js";

export interface IRemoveComponentGateway {
  removeComponent(
    request: RemoveComponentRequest,
  ): Promise<RemoveComponentResponse>;
}
