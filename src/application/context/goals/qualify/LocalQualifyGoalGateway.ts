import { IQualifyGoalGateway } from "./IQualifyGoalGateway.js";
import { QualifyGoalRequest } from "./QualifyGoalRequest.js";
import { QualifyGoalResponse } from "./QualifyGoalResponse.js";
import { QualifyGoalCommandHandler } from "./QualifyGoalCommandHandler.js";
import { IGoalQualifyReader } from "./IGoalQualifyReader.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import {
  GoalErrorMessages,
  GoalStatus,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";

export class LocalQualifyGoalGateway implements IQualifyGoalGateway {
  constructor(
    private readonly commandHandler: QualifyGoalCommandHandler,
    private readonly goalReader: IGoalQualifyReader,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
  ) {}

  async qualifyGoal(request: QualifyGoalRequest): Promise<QualifyGoalResponse> {
    // 1. Validate claim ownership - only the claimant can approve a goal
    const workerId = this.workerIdentityReader.workerId;
    const claimValidation = this.claimPolicy.canClaim(request.goalId, workerId);
    if (!claimValidation.allowed) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_CLAIMED_BY_ANOTHER_WORKER, {
          expiresAt: claimValidation.existingClaim.claimExpiresAt,
        }),
      );
    }

    // 2. Get current goal view to validate existence and status
    const goalView = await this.goalReader.findById(request.goalId);
    if (!goalView) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, {
          id: request.goalId,
        }),
      );
    }

    // 3. Validate goal is in "in-review" status
    if (goalView.status !== GoalStatus.INREVIEW) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.CANNOT_QUALIFY_IN_STATUS, {
          status: goalView.status,
        }),
      );
    }

    // 4. Delegate state change to command handler
    await this.commandHandler.execute({ goalId: request.goalId });

    // 5. Get updated goal view after state change
    const updatedGoalView = await this.goalReader.findById(request.goalId);
    if (!updatedGoalView) {
      throw new Error(`Goal not found after qualification: ${request.goalId}`);
    }

    return {
      goalId: request.goalId,
      objective: updatedGoalView.objective,
      status: updatedGoalView.status,
      nextGoalId: updatedGoalView.nextGoalId,
    };
  }
}
