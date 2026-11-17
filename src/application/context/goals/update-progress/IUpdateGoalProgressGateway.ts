import { UpdateGoalProgressRequest } from "./UpdateGoalProgressRequest.js";
import { UpdateGoalProgressResponse } from "./UpdateGoalProgressResponse.js";

export interface IUpdateGoalProgressGateway {
  updateGoalProgress(
    request: UpdateGoalProgressRequest,
  ): Promise<UpdateGoalProgressResponse>;
}
