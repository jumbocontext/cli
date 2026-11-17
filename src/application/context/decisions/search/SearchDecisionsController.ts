/**
 * SearchDecisionsController - Application controller that handles
 * search-decisions requests by delegating to ISearchDecisionsGateway.
 */

import { ISearchDecisionsGateway } from "./ISearchDecisionsGateway.js";
import { SearchDecisionsRequest } from "./SearchDecisionsRequest.js";
import { SearchDecisionsResponse } from "./SearchDecisionsResponse.js";

export class SearchDecisionsController {
  constructor(private readonly gateway: ISearchDecisionsGateway) {}

  async handle(
    request: SearchDecisionsRequest,
  ): Promise<SearchDecisionsResponse> {
    return this.gateway.searchDecisions(request);
  }
}
