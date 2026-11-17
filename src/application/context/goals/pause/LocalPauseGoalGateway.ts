import { IPauseGoalGateway } from "./IPauseGoalGateway.js";
import { PauseGoalRequest } from "./PauseGoalRequest.js";
import { PauseGoalResponse } from "./PauseGoalResponse.js";
import { PauseGoalCommandHandler } from "./PauseGoalCommandHandler.js";
import { IGoalPauseReader } from "./IGoalPauseReader.js";
import { GoalPausedReasons } from "../../../../domain/goals/GoalPausedReasons.js";

export class LocalPauseGoalGateway implements IPauseGoalGateway {
  constructor(
    private readonly commandHandler: PauseGoalCommandHandler,
    private readonly goalReader: IGoalPauseReader,
  ) {}

  async pauseGoal(request: PauseGoalRequest): Promise<PauseGoalResponse> {
    // Validate reason
    const validReasons = Object.values(GoalPausedReasons);
    if (!(validReasons as readonly string[]).includes(request.reason)) {
      throw new Error(
        `Invalid reason: ${request.reason}. Valid reasons: ${validReasons.join(", ")}`,
      );
    }

    // Execute command
    const result = await this.commandHandler.execute({
      goalId: request.goalId,
      reason: request.reason,
      note: request.note,
    });

    // Fetch updated view for display
    const view = await this.goalReader.findById(result.goalId);

    return {
      goalId: result.goalId,
      objective: view?.objective || "",
      status: view?.status || "paused",
      reason: request.reason,
    };
  }
}
