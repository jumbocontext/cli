import { ShowGoalRequest } from "./ShowGoalRequest.js";
import { ShowGoalResponse } from "./ShowGoalResponse.js";
import { IShowGoalGateway } from "./IShowGoalGateway.js";

export class ShowGoalController {
  constructor(private readonly gateway: IShowGoalGateway) {}

  async handle(request: ShowGoalRequest): Promise<ShowGoalResponse> {
    return this.gateway.showGoal(request);
  }
}
