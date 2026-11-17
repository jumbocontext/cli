/**
 * ISearchGuidelinesGateway - Application-layer gateway interface
 * defining the contract for searching guidelines.
 */

import { SearchGuidelinesRequest } from "./SearchGuidelinesRequest.js";
import { SearchGuidelinesResponse } from "./SearchGuidelinesResponse.js";

export interface ISearchGuidelinesGateway {
  searchGuidelines(
    request: SearchGuidelinesRequest,
  ): Promise<SearchGuidelinesResponse>;
}
