import { StartGoalRequest } from "./StartGoalRequest.js";
import { StartGoalResponse } from "./StartGoalResponse.js";
import { IStartGoalGateway } from "./IStartGoalGateway.js";

export class StartGoalController {
  constructor(private readonly gateway: IStartGoalGateway) {}

  async handle(request: StartGoalRequest): Promise<StartGoalResponse> {
    return this.gateway.startGoal(request);
  }
}
