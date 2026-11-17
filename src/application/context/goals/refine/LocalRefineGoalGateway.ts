import { IRefineGoalGateway } from "./IRefineGoalGateway.js";
import { RefineGoalRequest } from "./RefineGoalRequest.js";
import { RefineGoalResponse } from "./RefineGoalResponse.js";
import { RefineGoalCommandHandler } from "./RefineGoalCommandHandler.js";

export class LocalRefineGoalGateway implements IRefineGoalGateway {
  constructor(private readonly commandHandler: RefineGoalCommandHandler) {}

  async refineGoal(request: RefineGoalRequest): Promise<RefineGoalResponse> {
    const contextualView = await this.commandHandler.execute({
      goalId: request.goalId,
    });

    return {
      goalId: contextualView.goal.goalId,
      status: contextualView.goal.status,
    };
  }
}
