import { ISubmitGoalGateway } from "./ISubmitGoalGateway.js";
import { SubmitGoalRequest } from "./SubmitGoalRequest.js";
import { SubmitGoalResponse } from "./SubmitGoalResponse.js";
import { SubmitGoalCommandHandler } from "./SubmitGoalCommandHandler.js";

export class LocalSubmitGoalGateway implements ISubmitGoalGateway {
  constructor(private readonly commandHandler: SubmitGoalCommandHandler) {}

  async submitGoal(request: SubmitGoalRequest): Promise<SubmitGoalResponse> {
    const contextualView = await this.commandHandler.execute({
      goalId: request.goalId,
    });

    return {
      goalId: contextualView.goal.goalId,
      status: contextualView.goal.status,
      objective: contextualView.goal.objective,
    };
  }
}
