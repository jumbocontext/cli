import { IReverseDecisionGateway } from "./IReverseDecisionGateway.js";
import { ReverseDecisionRequest } from "./ReverseDecisionRequest.js";
import { ReverseDecisionResponse } from "./ReverseDecisionResponse.js";
import { ReverseDecisionCommandHandler } from "./ReverseDecisionCommandHandler.js";

export class LocalReverseDecisionGateway implements IReverseDecisionGateway {
  constructor(private readonly commandHandler: ReverseDecisionCommandHandler) {}

  async reverseDecision(
    request: ReverseDecisionRequest,
  ): Promise<ReverseDecisionResponse> {
    const result = await this.commandHandler.execute({
      decisionId: request.decisionId,
      reason: request.reason,
    });

    return {
      decisionId: result.decisionId,
    };
  }
}
