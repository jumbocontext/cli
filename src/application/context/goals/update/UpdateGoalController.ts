import { UpdateGoalRequest } from "./UpdateGoalRequest.js";
import { UpdateGoalResponse } from "./UpdateGoalResponse.js";
import { IUpdateGoalGateway } from "./IUpdateGoalGateway.js";

export class UpdateGoalController {
  constructor(private readonly gateway: IUpdateGoalGateway) {}

  async handle(request: UpdateGoalRequest): Promise<UpdateGoalResponse> {
    return this.gateway.updateGoal(request);
  }
}
