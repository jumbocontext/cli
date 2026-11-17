import { IUpdateDecisionGateway } from "./IUpdateDecisionGateway.js";
import { UpdateDecisionRequest } from "./UpdateDecisionRequest.js";
import { UpdateDecisionResponse } from "./UpdateDecisionResponse.js";
import { UpdateDecisionCommandHandler } from "./UpdateDecisionCommandHandler.js";

export class LocalUpdateDecisionGateway implements IUpdateDecisionGateway {
  constructor(private readonly commandHandler: UpdateDecisionCommandHandler) {}

  async updateDecision(
    request: UpdateDecisionRequest,
  ): Promise<UpdateDecisionResponse> {
    const result = await this.commandHandler.execute({
      decisionId: request.decisionId,
      title: request.title,
      context: request.context,
      rationale: request.rationale,
      alternatives: request.alternatives,
      consequences: request.consequences,
    });

    return {
      decisionId: result.decisionId,
    };
  }
}
