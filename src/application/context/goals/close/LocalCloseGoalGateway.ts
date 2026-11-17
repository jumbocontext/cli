import { ICloseGoalGateway } from "./ICloseGoalGateway.js";
import { CloseGoalRequest } from "./CloseGoalRequest.js";
import { CloseGoalResponse } from "./CloseGoalResponse.js";
import { CloseGoalCommandHandler } from "./CloseGoalCommandHandler.js";
import { IGoalCloseReader } from "./IGoalCloseReader.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import {
  GoalErrorMessages,
  formatErrorMessage,
} from "../../../../domain/goals/Constants.js";

export class LocalCloseGoalGateway implements ICloseGoalGateway {
  constructor(
    private readonly commandHandler: CloseGoalCommandHandler,
    private readonly goalReader: IGoalCloseReader,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
  ) {}

  async closeGoal(request: CloseGoalRequest): Promise<CloseGoalResponse> {
    // Validate claim ownership - only the claimant can close a goal
    const workerId = this.workerIdentityReader.workerId;
    const claimValidation = this.claimPolicy.canClaim(request.goalId, workerId);
    if (!claimValidation.allowed) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_CLAIMED_BY_ANOTHER_WORKER, {
          expiresAt: claimValidation.existingClaim.claimExpiresAt,
        }),
      );
    }

    // Delegate to command handler (validates CODIFYING status, performs state change)
    await this.commandHandler.execute({ goalId: request.goalId });

    // Get updated goal view
    const goalView = await this.goalReader.findById(request.goalId);
    if (!goalView) {
      throw new Error(`Goal not found after close: ${request.goalId}`);
    }

    // Check for next goal
    let nextGoal;
    if (goalView.nextGoalId) {
      const nextGoalView = await this.goalReader.findById(goalView.nextGoalId);
      if (nextGoalView) {
        nextGoal = {
          goalId: nextGoalView.goalId,
          objective: nextGoalView.objective,
          status: nextGoalView.status,
        };
      }
    }

    return {
      goalId: request.goalId,
      objective: goalView.objective,
      status: goalView.status,
      nextGoal,
    };
  }
}
