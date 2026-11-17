import { RejectGoalRequest } from "./RejectGoalRequest.js";
import { RejectGoalResponse } from "./RejectGoalResponse.js";
import { IRejectGoalGateway } from "./IRejectGoalGateway.js";

export class RejectGoalController {
  constructor(private readonly gateway: IRejectGoalGateway) {}

  async handle(request: RejectGoalRequest): Promise<RejectGoalResponse> {
    return this.gateway.rejectGoal(request);
  }
}
