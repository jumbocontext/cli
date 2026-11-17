import { PauseGoalRequest } from "./PauseGoalRequest.js";
import { PauseGoalResponse } from "./PauseGoalResponse.js";
import { IPauseGoalGateway } from "./IPauseGoalGateway.js";

export class PauseGoalController {
  constructor(private readonly gateway: IPauseGoalGateway) {}

  async handle(request: PauseGoalRequest): Promise<PauseGoalResponse> {
    return this.gateway.pauseGoal(request);
  }
}
