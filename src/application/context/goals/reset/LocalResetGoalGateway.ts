import { IResetGoalGateway } from "./IResetGoalGateway.js";
import { ResetGoalRequest } from "./ResetGoalRequest.js";
import { ResetGoalResponse } from "./ResetGoalResponse.js";
import { ResetGoalCommandHandler } from "./ResetGoalCommandHandler.js";
import { IGoalResetReader } from "./IGoalResetReader.js";

export class LocalResetGoalGateway implements IResetGoalGateway {
  constructor(
    private readonly commandHandler: ResetGoalCommandHandler,
    private readonly goalReader: IGoalResetReader,
  ) {}

  async resetGoal(request: ResetGoalRequest): Promise<ResetGoalResponse> {
    // Execute command
    const result = await this.commandHandler.execute({
      goalId: request.goalId,
    });

    // Fetch updated view for display
    const view = await this.goalReader.findById(result.goalId);

    return {
      goalId: result.goalId,
      objective: view?.objective || request.goalId,
      status: view?.status || "defined",
    };
  }
}
