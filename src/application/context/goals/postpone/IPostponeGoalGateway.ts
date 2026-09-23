import { PostponeGoalRequest } from "./PostponeGoalRequest.js";
import { PostponeGoalResponse } from "./PostponeGoalResponse.js";

export interface IPostponeGoalGateway {
  postponeGoal(request: PostponeGoalRequest): Promise<PostponeGoalResponse>;
}
