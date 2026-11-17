import { UnblockGoalRequest } from "./UnblockGoalRequest.js";
import { UnblockGoalResponse } from "./UnblockGoalResponse.js";
import { IUnblockGoalGateway } from "./IUnblockGoalGateway.js";

export class UnblockGoalController {
  constructor(private readonly gateway: IUnblockGoalGateway) {}

  async handle(request: UnblockGoalRequest): Promise<UnblockGoalResponse> {
    return this.gateway.unblockGoal(request);
  }
}
