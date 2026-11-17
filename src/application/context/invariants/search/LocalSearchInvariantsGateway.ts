/**
 * LocalSearchInvariantsGateway - Application-layer gateway implementation
 * that fulfills ISearchInvariantsGateway by delegating to IInvariantViewReader.search().
 */

import { IInvariantViewReader } from "../get/IInvariantViewReader.js";
import { ISearchInvariantsGateway } from "./ISearchInvariantsGateway.js";
import { SearchInvariantsRequest } from "./SearchInvariantsRequest.js";
import { SearchInvariantsResponse } from "./SearchInvariantsResponse.js";

export class LocalSearchInvariantsGateway implements ISearchInvariantsGateway {
  constructor(private readonly invariantViewReader: IInvariantViewReader) {}

  async searchInvariants(
    request: SearchInvariantsRequest,
  ): Promise<SearchInvariantsResponse> {
    const invariants = await this.invariantViewReader.search(request.criteria);
    return { invariants };
  }
}
