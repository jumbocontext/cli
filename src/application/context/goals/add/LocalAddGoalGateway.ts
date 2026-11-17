import { IAddGoalGateway } from "./IAddGoalGateway.js";
import { AddGoalRequest } from "./AddGoalRequest.js";
import { AddGoalResponse } from "./AddGoalResponse.js";
import { AddGoalCommandHandler } from "./AddGoalCommandHandler.js";

export class LocalAddGoalGateway implements IAddGoalGateway {
  constructor(private readonly commandHandler: AddGoalCommandHandler) {}

  async addGoal(request: AddGoalRequest): Promise<AddGoalResponse> {
    const result = await this.commandHandler.execute({
      title: request.title,
      objective: request.objective,
      successCriteria: request.successCriteria,
      scopeIn: request.scopeIn,
      scopeOut: request.scopeOut,
      nextGoalId: request.nextGoalId,
      previousGoalId: request.previousGoalId,
      prerequisiteGoals: request.prerequisiteGoals,
      branch: request.branch,
      worktree: request.worktree,
    });

    return {
      goalId: result.goalId,
    };
  }
}
