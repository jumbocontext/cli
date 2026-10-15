import type { RemoveDecisionRequest } from "./RemoveDecisionRequest.js";
import type { RemoveDecisionResponse } from "./RemoveDecisionResponse.js";
import type { IRemoveDecisionGateway } from "./IRemoveDecisionGateway.js";

export class RemoveDecisionController {
  constructor(private readonly gateway: IRemoveDecisionGateway) {}

  async handle(request: RemoveDecisionRequest): Promise<RemoveDecisionResponse> {
    return this.gateway.removeDecision(request);
  }
}
