import { ReviewGoalRequest } from "./ReviewGoalRequest.js";
import { ReviewGoalResponse } from "./ReviewGoalResponse.js";
import { IReviewGoalGateway } from "./IReviewGoalGateway.js";

export class ReviewGoalController {
  constructor(private readonly gateway: IReviewGoalGateway) {}

  async handle(request: ReviewGoalRequest): Promise<ReviewGoalResponse> {
    return this.gateway.reviewGoal(request);
  }
}
