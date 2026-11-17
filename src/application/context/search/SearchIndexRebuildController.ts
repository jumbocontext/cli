import { ISearchIndexRebuildGateway } from "./ISearchIndexRebuildGateway.js";
import { SearchIndexRebuildRequest } from "./SearchIndexRebuildRequest.js";
import { SearchIndexRebuildResponse } from "./SearchIndexRebuildResponse.js";

export class SearchIndexRebuildController {
  constructor(private readonly gateway: ISearchIndexRebuildGateway) {}

  async handle(
    request: SearchIndexRebuildRequest,
  ): Promise<SearchIndexRebuildResponse> {
    return this.gateway.rebuildSearchIndex(request);
  }
}
