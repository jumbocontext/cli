import { RestoreDecisionRequest } from "./RestoreDecisionRequest.js";
import { RestoreDecisionResponse } from "./RestoreDecisionResponse.js";
import { IRestoreDecisionGateway } from "./IRestoreDecisionGateway.js";

export class RestoreDecisionController {
  constructor(private readonly gateway: IRestoreDecisionGateway) {}

  async handle(
    request: RestoreDecisionRequest,
  ): Promise<RestoreDecisionResponse> {
    return this.gateway.restoreDecision(request);
  }
}
