import { SearchIndexRebuildRequest } from "./SearchIndexRebuildRequest.js";
import { SearchIndexRebuildResponse } from "./SearchIndexRebuildResponse.js";

export interface ISearchIndexRebuildGateway {
  rebuildSearchIndex(
    request: SearchIndexRebuildRequest,
  ): Promise<SearchIndexRebuildResponse>;
}
