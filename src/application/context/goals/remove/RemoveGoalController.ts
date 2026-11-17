import { RemoveGoalRequest } from "./RemoveGoalRequest.js";
import { RemoveGoalResponse } from "./RemoveGoalResponse.js";
import { IRemoveGoalGateway } from "./IRemoveGoalGateway.js";

export class RemoveGoalController {
  constructor(private readonly gateway: IRemoveGoalGateway) {}

  async handle(request: RemoveGoalRequest): Promise<RemoveGoalResponse> {
    return this.gateway.removeGoal(request);
  }
}
