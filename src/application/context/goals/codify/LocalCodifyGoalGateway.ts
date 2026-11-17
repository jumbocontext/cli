import { ICodifyGoalGateway } from "./ICodifyGoalGateway.js";
import { CodifyGoalRequest } from "./CodifyGoalRequest.js";
import { CodifyGoalResponse } from "./CodifyGoalResponse.js";
import { CodifyGoalCommandHandler } from "./CodifyGoalCommandHandler.js";

export class LocalCodifyGoalGateway implements ICodifyGoalGateway {
  constructor(private readonly commandHandler: CodifyGoalCommandHandler) {}

  async codifyGoal(request: CodifyGoalRequest): Promise<CodifyGoalResponse> {
    const goalContextView = await this.commandHandler.execute({
      goalId: request.goalId,
    });

    return {
      goalContextView,
    };
  }
}
