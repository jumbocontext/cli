import { AddGoalRequest } from "./AddGoalRequest.js";
import { AddGoalResponse } from "./AddGoalResponse.js";
import { IAddGoalGateway } from "./IAddGoalGateway.js";

export class AddGoalController {
  constructor(private readonly gateway: IAddGoalGateway) {}

  async handle(request: AddGoalRequest): Promise<AddGoalResponse> {
    return this.gateway.addGoal(request);
  }
}
