import { IGetDependenciesGateway } from "./IGetDependenciesGateway.js";
import { GetDependenciesRequest } from "./GetDependenciesRequest.js";
import { GetDependenciesResponse } from "./GetDependenciesResponse.js";
import { IDependencyViewReader } from "./IDependencyViewReader.js";

export class LocalGetDependenciesGateway implements IGetDependenciesGateway {
  constructor(private readonly dependencyViewReader: IDependencyViewReader) {}

  async getDependencies(
    request: GetDependenciesRequest,
  ): Promise<GetDependenciesResponse> {
    const dependencies = await this.dependencyViewReader.findAll(
      request.filter,
    );
    return { dependencies };
  }
}
