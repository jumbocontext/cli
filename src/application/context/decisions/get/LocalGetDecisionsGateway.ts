import { IGetDecisionsGateway } from "./IGetDecisionsGateway.js";
import { GetDecisionsRequest } from "./GetDecisionsRequest.js";
import { GetDecisionsResponse } from "./GetDecisionsResponse.js";
import { IDecisionViewReader } from "./IDecisionViewReader.js";

export class LocalGetDecisionsGateway implements IGetDecisionsGateway {
  constructor(private readonly decisionViewReader: IDecisionViewReader) {}

  async getDecisions(
    request: GetDecisionsRequest,
  ): Promise<GetDecisionsResponse> {
    const decisions = await this.decisionViewReader.findAll(request.status);
    return { decisions };
  }
}
