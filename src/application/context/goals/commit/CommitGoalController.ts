import { CommitGoalRequest } from "./CommitGoalRequest.js";
import { CommitGoalResponse } from "./CommitGoalResponse.js";
import { ICommitGoalGateway } from "./ICommitGoalGateway.js";

export class CommitGoalController {
  constructor(private readonly gateway: ICommitGoalGateway) {}

  async handle(request: CommitGoalRequest): Promise<CommitGoalResponse> {
    return this.gateway.commitGoal(request);
  }
}
