/**
 * ISearchInvariantsGateway - Application-layer gateway interface
 * defining the contract for searching invariants.
 */

import { SearchInvariantsRequest } from "./SearchInvariantsRequest.js";
import { SearchInvariantsResponse } from "./SearchInvariantsResponse.js";

export interface ISearchInvariantsGateway {
  searchInvariants(
    request: SearchInvariantsRequest,
  ): Promise<SearchInvariantsResponse>;
}
