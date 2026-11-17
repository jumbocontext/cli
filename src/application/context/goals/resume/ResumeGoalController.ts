import { ResumeGoalRequest } from "./ResumeGoalRequest.js";
import { ResumeGoalResponse } from "./ResumeGoalResponse.js";
import { IResumeGoalGateway } from "./IResumeGoalGateway.js";

export class ResumeGoalController {
  constructor(private readonly gateway: IResumeGoalGateway) {}

  async handle(request: ResumeGoalRequest): Promise<ResumeGoalResponse> {
    return this.gateway.resumeGoal(request);
  }
}
