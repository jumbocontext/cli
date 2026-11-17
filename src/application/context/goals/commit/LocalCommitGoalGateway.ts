import { ICommitGoalGateway } from "./ICommitGoalGateway.js";
import { CommitGoalRequest } from "./CommitGoalRequest.js";
import { CommitGoalResponse } from "./CommitGoalResponse.js";
import { CommitGoalCommandHandler } from "./CommitGoalCommandHandler.js";

export class LocalCommitGoalGateway implements ICommitGoalGateway {
  constructor(private readonly commandHandler: CommitGoalCommandHandler) {}

  async commitGoal(request: CommitGoalRequest): Promise<CommitGoalResponse> {
    const contextualView = await this.commandHandler.execute({
      goalId: request.goalId,
    });

    return {
      goalId: contextualView.goal.goalId,
      status: contextualView.goal.status,
    };
  }
}
