import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { IPostponeGoalGateway } from "./IPostponeGoalGateway.js";
import { PostponeGoalCommandHandler } from "./PostponeGoalCommandHandler.js";
import { PostponeGoalRequest } from "./PostponeGoalRequest.js";
import { PostponeGoalResponse } from "./PostponeGoalResponse.js";

export class LocalPostponeGoalGateway implements IPostponeGoalGateway {
  constructor(private readonly commandHandler: PostponeGoalCommandHandler) {}

  async postponeGoal(request: PostponeGoalRequest): Promise<PostponeGoalResponse> {
    await this.commandHandler.execute({ goalId: request.goalId });
    return { status: GoalStatus.POSTPONED };
  }
}
