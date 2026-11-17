import { GetDependenciesRequest } from "./GetDependenciesRequest.js";
import { GetDependenciesResponse } from "./GetDependenciesResponse.js";
import { IGetDependenciesGateway } from "./IGetDependenciesGateway.js";

export class GetDependenciesController {
  constructor(private readonly gateway: IGetDependenciesGateway) {}

  async handle(
    request: GetDependenciesRequest,
  ): Promise<GetDependenciesResponse> {
    return this.gateway.getDependencies(request);
  }
}
