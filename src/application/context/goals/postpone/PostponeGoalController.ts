import { IPostponeGoalGateway } from "./IPostponeGoalGateway.js";
import { PostponeGoalRequest } from "./PostponeGoalRequest.js";
import { PostponeGoalResponse } from "./PostponeGoalResponse.js";

export class PostponeGoalController {
  constructor(private readonly gateway: IPostponeGoalGateway) {}

  async handle(request: PostponeGoalRequest): Promise<PostponeGoalResponse> {
    return this.gateway.postponeGoal(request);
  }
}
