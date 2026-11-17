/**
 * ISearchDependenciesGateway - Application-layer gateway interface
 * defining the contract for searching dependencies.
 */

import { SearchDependenciesRequest } from "./SearchDependenciesRequest.js";
import { SearchDependenciesResponse } from "./SearchDependenciesResponse.js";

export interface ISearchDependenciesGateway {
  searchDependencies(
    request: SearchDependenciesRequest,
  ): Promise<SearchDependenciesResponse>;
}
