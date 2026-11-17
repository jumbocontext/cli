/**
 * ISearchDecisionsGateway - Application-layer gateway interface
 * defining the contract for searching decisions.
 */

import { SearchDecisionsRequest } from "./SearchDecisionsRequest.js";
import { SearchDecisionsResponse } from "./SearchDecisionsResponse.js";

export interface ISearchDecisionsGateway {
  searchDecisions(
    request: SearchDecisionsRequest,
  ): Promise<SearchDecisionsResponse>;
}
