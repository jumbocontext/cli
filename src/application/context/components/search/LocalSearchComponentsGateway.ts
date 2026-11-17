/**
 * LocalSearchComponentsGateway - Application-layer gateway implementation
 * that fulfills ISearchComponentsGateway by delegating to IComponentViewReader.search().
 */

import { ISearchComponentsGateway } from "./ISearchComponentsGateway.js";
import { SearchComponentsRequest } from "./SearchComponentsRequest.js";
import { SearchComponentsResponse } from "./SearchComponentsResponse.js";
import { IComponentViewReader } from "../get/IComponentViewReader.js";

export class LocalSearchComponentsGateway implements ISearchComponentsGateway {
  constructor(private readonly componentViewReader: IComponentViewReader) {}

  async searchComponents(
    request: SearchComponentsRequest,
  ): Promise<SearchComponentsResponse> {
    const components = await this.componentViewReader.search(request.criteria);
    return { components };
  }
}
