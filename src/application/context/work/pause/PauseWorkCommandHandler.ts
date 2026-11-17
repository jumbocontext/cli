import { PauseWorkCommand } from "./PauseWorkCommand.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { PauseGoalCommandHandler } from "../../goals/pause/PauseGoalCommandHandler.js";
import { PauseGoalCommand } from "../../goals/pause/PauseGoalCommand.js";
import { GoalPausedReasons } from "../../../../domain/goals/GoalPausedReasons.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { GoalView } from "../../goals/GoalView.js";
import { ILogger } from "../../../logging/ILogger.js";

/**
 * Result of pausing work.
 */
export interface PauseWorkResult {
  readonly goalId: string;
  readonly objective: string;
}

/**
 * Handles pausing the current worker's active goal.
 * Queries for the goal in DOING status claimed by the current worker,
 * then delegates to PauseGoalCommandHandler with reason 'WorkPaused'.
 */
export class PauseWorkCommandHandler {
  constructor(
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly pauseGoalCommandHandler: PauseGoalCommandHandler,
    private readonly logger: ILogger,
  ) {}

  async execute(_command: PauseWorkCommand): Promise<PauseWorkResult> {
    this.logger.debug("[PauseWorkCommandHandler] Starting execute");

    // 1. Get current worker's identity
    const workerId = this.workerIdentityReader.workerId;
    this.logger.debug("[PauseWorkCommandHandler] Worker ID obtained", {
      workerId,
    });

    // 2. Query for goals in 'doing' status
    const doingGoals = await this.goalStatusReader.findByStatus(
      GoalStatus.DOING,
    );
    this.logger.info("[PauseWorkCommandHandler] Queried doing goals", {
      count: doingGoals.length,
      goals: doingGoals.map((g) => ({
        id: g.goalId,
        claimedBy: g.claimedBy,
        objective: g.objective,
      })),
    });

    // 3. Find the goal claimed by this worker
    const activeGoal = doingGoals.find(
      (goal: GoalView) => goal.claimedBy === workerId,
    );

    if (!activeGoal) {
      const errorContext = {
        workerId,
        doingGoalsCount: doingGoals.length,
        allClaimedBy: doingGoals.map((g) => g.claimedBy),
      };

      this.logger.error(
        "[PauseWorkCommandHandler] No active goal found for worker",
        undefined,
        errorContext,
      );

      throw new Error("No active goal found for current worker");
    }

    this.logger.info("[PauseWorkCommandHandler] Found active goal for worker", {
      goalId: activeGoal.goalId,
      objective: activeGoal.objective,
    });

    // 4. Create and execute PauseGoalCommand
    const pauseCommand: PauseGoalCommand = {
      goalId: activeGoal.goalId,
      reason: GoalPausedReasons.WorkPaused,
    };

    await this.pauseGoalCommandHandler.execute(pauseCommand);

    return {
      goalId: activeGoal.goalId,
      objective: activeGoal.objective,
    };
  }
}
