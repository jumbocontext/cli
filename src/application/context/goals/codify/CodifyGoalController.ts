import { CodifyGoalRequest } from "./CodifyGoalRequest.js";
import { CodifyGoalResponse } from "./CodifyGoalResponse.js";
import { ICodifyGoalGateway } from "./ICodifyGoalGateway.js";

export class CodifyGoalController {
  constructor(private readonly gateway: ICodifyGoalGateway) {}

  async handle(request: CodifyGoalRequest): Promise<CodifyGoalResponse> {
    return this.gateway.codifyGoal(request);
  }
}
