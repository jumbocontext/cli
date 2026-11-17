/**
 * SearchInvariantsController - Application controller that handles
 * search-invariants requests by delegating to ISearchInvariantsGateway.
 */

import { ISearchInvariantsGateway } from "./ISearchInvariantsGateway.js";
import { SearchInvariantsRequest } from "./SearchInvariantsRequest.js";
import { SearchInvariantsResponse } from "./SearchInvariantsResponse.js";

export class SearchInvariantsController {
  constructor(private readonly gateway: ISearchInvariantsGateway) {}

  async handle(
    request: SearchInvariantsRequest,
  ): Promise<SearchInvariantsResponse> {
    return this.gateway.searchInvariants(request);
  }
}
