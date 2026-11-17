import { GetDependenciesRequest } from "./GetDependenciesRequest.js";
import { GetDependenciesResponse } from "./GetDependenciesResponse.js";

export interface IGetDependenciesGateway {
  getDependencies(
    request: GetDependenciesRequest,
  ): Promise<GetDependenciesResponse>;
}
