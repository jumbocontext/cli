import { IDecisionViewReader } from "../get/IDecisionViewReader.js";
import { IShowDecisionGateway } from "./IShowDecisionGateway.js";
import { ShowDecisionRequest } from "./ShowDecisionRequest.js";
import { ShowDecisionResponse } from "./ShowDecisionResponse.js";

export class LocalShowDecisionGateway implements IShowDecisionGateway {
  constructor(private readonly decisionViewReader: IDecisionViewReader) {}

  async showDecision(
    request: ShowDecisionRequest,
  ): Promise<ShowDecisionResponse> {
    const [decision] = await this.decisionViewReader.findByIds([
      request.decisionId,
    ]);

    if (!decision) {
      throw new Error(`Decision not found: ${request.decisionId}`);
    }

    return { decision };
  }
}
