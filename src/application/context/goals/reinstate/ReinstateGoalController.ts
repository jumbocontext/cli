import { IReinstateGoalGateway } from "./IReinstateGoalGateway.js";
import { ReinstateGoalRequest } from "./ReinstateGoalRequest.js";
import { ReinstateGoalResponse } from "./ReinstateGoalResponse.js";

export class ReinstateGoalController {
  constructor(private readonly gateway: IReinstateGoalGateway) {}

  async handle(request: ReinstateGoalRequest): Promise<ReinstateGoalResponse> {
    return this.gateway.reinstateGoal(request);
  }
}
