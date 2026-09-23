import { ReinstateGoalRequest } from "./ReinstateGoalRequest.js";
import { ReinstateGoalResponse } from "./ReinstateGoalResponse.js";

export interface IReinstateGoalGateway {
  reinstateGoal(request: ReinstateGoalRequest): Promise<ReinstateGoalResponse>;
}
