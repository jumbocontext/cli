import { IRestoreDecisionGateway } from "./IRestoreDecisionGateway.js";
import { RestoreDecisionRequest } from "./RestoreDecisionRequest.js";
import { RestoreDecisionResponse } from "./RestoreDecisionResponse.js";
import { RestoreDecisionCommandHandler } from "./RestoreDecisionCommandHandler.js";

export class LocalRestoreDecisionGateway implements IRestoreDecisionGateway {
  constructor(private readonly commandHandler: RestoreDecisionCommandHandler) {}

  async restoreDecision(
    request: RestoreDecisionRequest,
  ): Promise<RestoreDecisionResponse> {
    const result = await this.commandHandler.execute({
      decisionId: request.decisionId,
      reason: request.reason,
    });

    return {
      decisionId: result.decisionId,
    };
  }
}
