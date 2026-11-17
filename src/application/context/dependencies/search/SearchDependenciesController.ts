/**
 * SearchDependenciesController - Application controller that handles
 * search-dependencies requests by delegating to ISearchDependenciesGateway.
 */

import { ISearchDependenciesGateway } from "./ISearchDependenciesGateway.js";
import { SearchDependenciesRequest } from "./SearchDependenciesRequest.js";
import { SearchDependenciesResponse } from "./SearchDependenciesResponse.js";

export class SearchDependenciesController {
  constructor(private readonly gateway: ISearchDependenciesGateway) {}

  async handle(
    request: SearchDependenciesRequest,
  ): Promise<SearchDependenciesResponse> {
    return this.gateway.searchDependencies(request);
  }
}
