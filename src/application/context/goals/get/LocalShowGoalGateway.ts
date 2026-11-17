import { IShowGoalGateway } from "./IShowGoalGateway.js";
import { ShowGoalRequest } from "./ShowGoalRequest.js";
import { ShowGoalResponse } from "./ShowGoalResponse.js";
import { GoalContextQueryHandler } from "./GoalContextQueryHandler.js";

export class LocalShowGoalGateway implements IShowGoalGateway {
  constructor(
    private readonly goalContextQueryHandler: GoalContextQueryHandler,
  ) {}

  async showGoal(request: ShowGoalRequest): Promise<ShowGoalResponse> {
    const contextualGoalView = await this.goalContextQueryHandler.execute(
      request.goalId,
    );
    return { contextualGoalView };
  }
}
