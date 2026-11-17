/**
 * SearchGuidelinesController - Application controller that handles
 * search-guidelines requests by delegating to ISearchGuidelinesGateway.
 */

import { ISearchGuidelinesGateway } from "./ISearchGuidelinesGateway.js";
import { SearchGuidelinesRequest } from "./SearchGuidelinesRequest.js";
import { SearchGuidelinesResponse } from "./SearchGuidelinesResponse.js";

export class SearchGuidelinesController {
  constructor(private readonly gateway: ISearchGuidelinesGateway) {}

  async handle(
    request: SearchGuidelinesRequest,
  ): Promise<SearchGuidelinesResponse> {
    return this.gateway.searchGuidelines(request);
  }
}
