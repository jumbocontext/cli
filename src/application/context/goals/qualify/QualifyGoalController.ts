import { QualifyGoalRequest } from "./QualifyGoalRequest.js";
import { QualifyGoalResponse } from "./QualifyGoalResponse.js";
import { IQualifyGoalGateway } from "./IQualifyGoalGateway.js";

export class QualifyGoalController {
  constructor(private readonly gateway: IQualifyGoalGateway) {}

  async handle(request: QualifyGoalRequest): Promise<QualifyGoalResponse> {
    return this.gateway.qualifyGoal(request);
  }
}
