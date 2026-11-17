import { IBlockGoalGateway } from "./IBlockGoalGateway.js";
import { BlockGoalRequest } from "./BlockGoalRequest.js";
import { BlockGoalResponse } from "./BlockGoalResponse.js";
import { BlockGoalCommandHandler } from "./BlockGoalCommandHandler.js";

export class LocalBlockGoalGateway implements IBlockGoalGateway {
  constructor(private readonly commandHandler: BlockGoalCommandHandler) {}

  async blockGoal(request: BlockGoalRequest): Promise<BlockGoalResponse> {
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
