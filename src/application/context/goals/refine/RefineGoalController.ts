import { RefineGoalRequest } from "./RefineGoalRequest.js";
import { RefineGoalResponse } from "./RefineGoalResponse.js";
import { IRefineGoalGateway } from "./IRefineGoalGateway.js";

export class RefineGoalController {
  constructor(private readonly gateway: IRefineGoalGateway) {}

  async handle(request: RefineGoalRequest): Promise<RefineGoalResponse> {
    return this.gateway.refineGoal(request);
  }
}
