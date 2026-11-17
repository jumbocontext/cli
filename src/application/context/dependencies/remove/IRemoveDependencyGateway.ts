import { RemoveDependencyRequest } from "./RemoveDependencyRequest.js";
import { RemoveDependencyResponse } from "./RemoveDependencyResponse.js";

export interface IRemoveDependencyGateway {
  removeDependency(
    request: RemoveDependencyRequest,
  ): Promise<RemoveDependencyResponse>;
}
