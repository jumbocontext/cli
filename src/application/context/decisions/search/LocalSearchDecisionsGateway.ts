/**
 * LocalSearchDecisionsGateway - Application-layer gateway implementation
 * that fulfills ISearchDecisionsGateway by delegating to IDecisionViewReader.search().
 */

import { IDecisionViewReader } from "../get/IDecisionViewReader.js";
import { ISearchDecisionsGateway } from "./ISearchDecisionsGateway.js";
import { SearchDecisionsRequest } from "./SearchDecisionsRequest.js";
import { SearchDecisionsResponse } from "./SearchDecisionsResponse.js";

export class LocalSearchDecisionsGateway implements ISearchDecisionsGateway {
  constructor(private readonly decisionViewReader: IDecisionViewReader) {}

  async searchDecisions(
    request: SearchDecisionsRequest,
  ): Promise<SearchDecisionsResponse> {
    const decisions = await this.decisionViewReader.search(request.criteria);
    return { decisions };
  }
}
