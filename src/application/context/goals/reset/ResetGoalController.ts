import { ResetGoalRequest } from "./ResetGoalRequest.js";
import { ResetGoalResponse } from "./ResetGoalResponse.js";
import { IResetGoalGateway } from "./IResetGoalGateway.js";

export class ResetGoalController {
  constructor(private readonly gateway: IResetGoalGateway) {}

  async handle(request: ResetGoalRequest): Promise<ResetGoalResponse> {
    return this.gateway.resetGoal(request);
  }
}
