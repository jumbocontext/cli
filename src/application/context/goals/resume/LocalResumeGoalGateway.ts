import { IResumeGoalGateway } from "./IResumeGoalGateway.js";
import { ResumeGoalRequest } from "./ResumeGoalRequest.js";
import { ResumeGoalResponse } from "./ResumeGoalResponse.js";
import { ResumeGoalCommandHandler } from "./ResumeGoalCommandHandler.js";

export class LocalResumeGoalGateway implements IResumeGoalGateway {
  constructor(private readonly commandHandler: ResumeGoalCommandHandler) {}

  async resumeGoal(request: ResumeGoalRequest): Promise<ResumeGoalResponse> {
    const contextualGoalView = await this.commandHandler.execute({
      goalId: request.goalId,
      note: request.note,
    });

    return { contextualGoalView };
  }
}
