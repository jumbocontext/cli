import { IAddDecisionGateway } from "./IAddDecisionGateway.js";
import { AddDecisionRequest } from "./AddDecisionRequest.js";
import { AddDecisionResponse } from "./AddDecisionResponse.js";
import { AddDecisionCommandHandler } from "./AddDecisionCommandHandler.js";

export class LocalAddDecisionGateway implements IAddDecisionGateway {
  constructor(private readonly commandHandler: AddDecisionCommandHandler) {}

  async addDecision(request: AddDecisionRequest): Promise<AddDecisionResponse> {
    const result = await this.commandHandler.execute({
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
