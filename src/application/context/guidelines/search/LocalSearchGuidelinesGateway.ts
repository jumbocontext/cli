/**
 * LocalSearchGuidelinesGateway - Application-layer gateway implementation
 * that fulfills ISearchGuidelinesGateway by delegating to IGuidelineViewReader.search().
 */

import { IGuidelineViewReader } from "../get/IGuidelineViewReader.js";
import { ISearchGuidelinesGateway } from "./ISearchGuidelinesGateway.js";
import { SearchGuidelinesRequest } from "./SearchGuidelinesRequest.js";
import { SearchGuidelinesResponse } from "./SearchGuidelinesResponse.js";

export class LocalSearchGuidelinesGateway implements ISearchGuidelinesGateway {
  constructor(private readonly guidelineViewReader: IGuidelineViewReader) {}

  async searchGuidelines(
    request: SearchGuidelinesRequest,
  ): Promise<SearchGuidelinesResponse> {
    const guidelines = await this.guidelineViewReader.search(request.criteria);
    return { guidelines };
  }
}
