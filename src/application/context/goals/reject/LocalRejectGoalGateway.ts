import { IRejectGoalGateway } from "./IRejectGoalGateway.js";
import { RejectGoalRequest } from "./RejectGoalRequest.js";
import { RejectGoalResponse } from "./RejectGoalResponse.js";
import { RejectGoalCommandHandler } from "./RejectGoalCommandHandler.js";

export class LocalRejectGoalGateway implements IRejectGoalGateway {
  constructor(private readonly commandHandler: RejectGoalCommandHandler) {}

  async rejectGoal(request: RejectGoalRequest): Promise<RejectGoalResponse> {
    const contextualView = await this.commandHandler.execute({
      goalId: request.goalId,
      reviewIssues: request.reviewIssues,
    });

    return {
      goalId: contextualView.goal.goalId,
      status: contextualView.goal.status,
      objective: contextualView.goal.objective,
      reviewIssues: request.reviewIssues,
      nextGoalId: contextualView.goal.nextGoalId,
    };
  }
}
