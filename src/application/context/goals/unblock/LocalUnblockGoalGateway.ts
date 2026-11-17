import { IUnblockGoalGateway } from "./IUnblockGoalGateway.js";
import { UnblockGoalRequest } from "./UnblockGoalRequest.js";
import { UnblockGoalResponse } from "./UnblockGoalResponse.js";
import { UnblockGoalCommandHandler } from "./UnblockGoalCommandHandler.js";

export class LocalUnblockGoalGateway implements IUnblockGoalGateway {
  constructor(private readonly commandHandler: UnblockGoalCommandHandler) {}

  async unblockGoal(request: UnblockGoalRequest): Promise<UnblockGoalResponse> {
    const result = await this.commandHandler.execute({
      goalId: request.goalId,
      note: request.note,
    });

    return {
      goalId: result.goalId,
      note: request.note,
    };
  }
}
