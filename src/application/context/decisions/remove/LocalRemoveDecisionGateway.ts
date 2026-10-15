import { DecisionStatus } from "../../../../domain/decisions/Constants.js";
import type { IRemoveDecisionGateway } from "./IRemoveDecisionGateway.js";
import type { RemoveDecisionRequest } from "./RemoveDecisionRequest.js";
import type { RemoveDecisionResponse } from "./RemoveDecisionResponse.js";
import type { RemoveDecisionCommandHandler } from "./RemoveDecisionCommandHandler.js";

export class LocalRemoveDecisionGateway implements IRemoveDecisionGateway {
  constructor(private readonly commandHandler: RemoveDecisionCommandHandler) {}

  async removeDecision(request: RemoveDecisionRequest): Promise<RemoveDecisionResponse> {
    const result = await this.commandHandler.execute({ decisionId: request.decisionId });
    return { decisionId: result.decisionId, status: DecisionStatus.REMOVED };
  }
}
