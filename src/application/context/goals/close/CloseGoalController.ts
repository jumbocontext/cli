import { CloseGoalRequest } from "./CloseGoalRequest.js";
import { CloseGoalResponse } from "./CloseGoalResponse.js";
import { ICloseGoalGateway } from "./ICloseGoalGateway.js";

export class CloseGoalController {
  constructor(private readonly gateway: ICloseGoalGateway) {}

  async handle(request: CloseGoalRequest): Promise<CloseGoalResponse> {
    return this.gateway.closeGoal(request);
  }
}
