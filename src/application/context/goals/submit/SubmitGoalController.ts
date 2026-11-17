import { SubmitGoalRequest } from "./SubmitGoalRequest.js";
import { SubmitGoalResponse } from "./SubmitGoalResponse.js";
import { ISubmitGoalGateway } from "./ISubmitGoalGateway.js";

export class SubmitGoalController {
  constructor(private readonly gateway: ISubmitGoalGateway) {}

  async handle(request: SubmitGoalRequest): Promise<SubmitGoalResponse> {
    return this.gateway.submitGoal(request);
  }
}
