import { IStartGoalGateway } from "./IStartGoalGateway.js";
import { StartGoalRequest } from "./StartGoalRequest.js";
import { StartGoalResponse } from "./StartGoalResponse.js";
import { StartGoalCommandHandler } from "./StartGoalCommandHandler.js";

export class LocalStartGoalGateway implements IStartGoalGateway {
  constructor(private readonly commandHandler: StartGoalCommandHandler) {}

  async startGoal(request: StartGoalRequest): Promise<StartGoalResponse> {
    const goalContextView = await this.commandHandler.execute({
      goalId: request.goalId,
    });

    return {
      goalContextView,
    };
  }
}
