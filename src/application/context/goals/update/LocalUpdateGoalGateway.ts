import { IUpdateGoalGateway } from "./IUpdateGoalGateway.js";
import { UpdateGoalRequest } from "./UpdateGoalRequest.js";
import { UpdateGoalResponse } from "./UpdateGoalResponse.js";
import { UpdateGoalCommandHandler } from "./UpdateGoalCommandHandler.js";

export class LocalUpdateGoalGateway implements IUpdateGoalGateway {
  constructor(private readonly commandHandler: UpdateGoalCommandHandler) {}

  async updateGoal(request: UpdateGoalRequest): Promise<UpdateGoalResponse> {
    const result = await this.commandHandler.execute({
      goalId: request.goalId,
      title: request.title,
      objective: request.objective,
      successCriteria: request.successCriteria,
      scopeIn: request.scopeIn,
      scopeOut: request.scopeOut,
      nextGoalId: request.nextGoalId,
      prerequisiteGoals: request.prerequisiteGoals,
      branch: request.branch,
      worktree: request.worktree,
    });

    return {
      goalId: result.goalId,
    };
  }
}
