import { ISupersedeDecisionGateway } from "./ISupersedeDecisionGateway.js";
import { SupersedeDecisionRequest } from "./SupersedeDecisionRequest.js";
import { SupersedeDecisionResponse } from "./SupersedeDecisionResponse.js";
import { SupersedeDecisionCommandHandler } from "./SupersedeDecisionCommandHandler.js";

export class LocalSupersedeDecisionGateway implements ISupersedeDecisionGateway {
  constructor(
    private readonly commandHandler: SupersedeDecisionCommandHandler,
  ) {}

  async supersedeDecision(
    request: SupersedeDecisionRequest,
  ): Promise<SupersedeDecisionResponse> {
    const result = await this.commandHandler.execute({
      decisionId: request.decisionId,
      supersededBy: request.supersededBy,
    });

    return {
      decisionId: result.decisionId,
    };
  }
}
