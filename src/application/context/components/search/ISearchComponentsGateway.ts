/**
 * ISearchComponentsGateway - Application-layer gateway interface
 * defining the contract for searching components.
 */

import { SearchComponentsRequest } from "./SearchComponentsRequest.js";
import { SearchComponentsResponse } from "./SearchComponentsResponse.js";

export interface ISearchComponentsGateway {
  searchComponents(
    request: SearchComponentsRequest,
  ): Promise<SearchComponentsResponse>;
}
