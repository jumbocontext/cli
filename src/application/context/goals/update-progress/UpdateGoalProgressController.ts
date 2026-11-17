import { UpdateGoalProgressRequest } from "./UpdateGoalProgressRequest.js";
import { UpdateGoalProgressResponse } from "./UpdateGoalProgressResponse.js";
import { IUpdateGoalProgressGateway } from "./IUpdateGoalProgressGateway.js";

export class UpdateGoalProgressController {
  constructor(private readonly gateway: IUpdateGoalProgressGateway) {}

  async handle(
    request: UpdateGoalProgressRequest,
  ): Promise<UpdateGoalProgressResponse> {
    return this.gateway.updateGoalProgress(request);
  }
}
