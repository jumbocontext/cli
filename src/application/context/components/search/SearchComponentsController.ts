/**
 * SearchComponentsController - Application controller that handles
 * search-components requests by delegating to ISearchComponentsGateway.
 */

import { SearchComponentsRequest } from "./SearchComponentsRequest.js";
import { SearchComponentsResponse } from "./SearchComponentsResponse.js";
import { ISearchComponentsGateway } from "./ISearchComponentsGateway.js";

export class SearchComponentsController {
  constructor(private readonly gateway: ISearchComponentsGateway) {}

  async handle(
    request: SearchComponentsRequest,
  ): Promise<SearchComponentsResponse> {
    return this.gateway.searchComponents(request);
  }
}
