import { IRemoveGoalGateway } from "./IRemoveGoalGateway.js";
import { RemoveGoalRequest } from "./RemoveGoalRequest.js";
import { RemoveGoalResponse } from "./RemoveGoalResponse.js";
import { RemoveGoalCommandHandler } from "./RemoveGoalCommandHandler.js";
import { IGoalRemoveReader } from "./IGoalRemoveReader.js";

export class LocalRemoveGoalGateway implements IRemoveGoalGateway {
  constructor(
    private readonly commandHandler: RemoveGoalCommandHandler,
    private readonly goalReader: IGoalRemoveReader,
  ) {}

  async removeGoal(request: RemoveGoalRequest): Promise<RemoveGoalResponse> {
    // Fetch view before removal for display
    const view = await this.goalReader.findById(request.goalId);

    // Execute command
    const result = await this.commandHandler.execute({
      goalId: request.goalId,
    });

    return {
      goalId: result.goalId,
      objective: view?.objective || request.goalId,
    };
  }
}
