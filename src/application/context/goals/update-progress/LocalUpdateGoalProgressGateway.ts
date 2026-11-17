import { IUpdateGoalProgressGateway } from "./IUpdateGoalProgressGateway.js";
import { UpdateGoalProgressRequest } from "./UpdateGoalProgressRequest.js";
import { UpdateGoalProgressResponse } from "./UpdateGoalProgressResponse.js";
import { UpdateGoalProgressCommandHandler } from "./UpdateGoalProgressCommandHandler.js";

export class LocalUpdateGoalProgressGateway implements IUpdateGoalProgressGateway {
  constructor(
    private readonly commandHandler: UpdateGoalProgressCommandHandler,
  ) {}

  async updateGoalProgress(
    request: UpdateGoalProgressRequest,
  ): Promise<UpdateGoalProgressResponse> {
    const goalContextView = await this.commandHandler.execute({
      goalId: request.goalId,
      taskDescription: request.taskDescription,
    });

    return {
      goalContextView,
    };
  }
}
