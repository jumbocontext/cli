/**
 * LocalSearchDependenciesGateway - Application-layer gateway implementation
 * that fulfills ISearchDependenciesGateway by delegating to IDependencyViewReader.search().
 */

import { IDependencyViewReader } from "../get/IDependencyViewReader.js";
import { ISearchDependenciesGateway } from "./ISearchDependenciesGateway.js";
import { SearchDependenciesRequest } from "./SearchDependenciesRequest.js";
import { SearchDependenciesResponse } from "./SearchDependenciesResponse.js";

export class LocalSearchDependenciesGateway implements ISearchDependenciesGateway {
  constructor(private readonly dependencyViewReader: IDependencyViewReader) {}

  async searchDependencies(
    request: SearchDependenciesRequest,
  ): Promise<SearchDependenciesResponse> {
    const dependencies = await this.dependencyViewReader.search(
      request.criteria,
    );
    return { dependencies };
  }
}
