import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { IReinstateGoalGateway } from "./IReinstateGoalGateway.js";
import { ReinstateGoalCommandHandler } from "./ReinstateGoalCommandHandler.js";
import { ReinstateGoalRequest } from "./ReinstateGoalRequest.js";
import { ReinstateGoalResponse } from "./ReinstateGoalResponse.js";

export class LocalReinstateGoalGateway implements IReinstateGoalGateway {
  constructor(private readonly commandHandler: ReinstateGoalCommandHandler) {}

  async reinstateGoal(request: ReinstateGoalRequest): Promise<ReinstateGoalResponse> {
    await this.commandHandler.execute({ goalId: request.goalId });
    return { status: GoalStatus.TODO };
  }
}
