import { IResumeWorkGateway } from "./IResumeWorkGateway.js";
import { ResumeWorkRequest } from "./ResumeWorkRequest.js";
import { ResumeWorkResponse } from "./ResumeWorkResponse.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { ResumeGoalCommandHandler } from "../../goals/resume/ResumeGoalCommandHandler.js";
import { SessionContextQueryHandler } from "../../sessions/get/SessionContextQueryHandler.js";
import { ContextualSessionView } from "../../sessions/get/ContextualSessionView.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { GoalView } from "../../goals/GoalView.js";
import { ILogger } from "../../../logging/ILogger.js";

export class LocalResumeWorkGateway implements IResumeWorkGateway {
  constructor(
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly resumeGoalCommandHandler: ResumeGoalCommandHandler,
    private readonly sessionContextQueryHandler: SessionContextQueryHandler,
    private readonly logger: ILogger,
  ) {}

  async resumeWork(_request: ResumeWorkRequest): Promise<ResumeWorkResponse> {
    // 1. Get current worker's identity
    const workerId = this.workerIdentityReader.workerId;

    // 2. Query for goals in 'paused' status
    const pausedGoals = await this.goalStatusReader.findByStatus(
      GoalStatus.PAUSED,
    );

    // 3. Find the goal claimed by this worker
    const pausedGoal = pausedGoals.find(
      (goal: GoalView) => goal.claimedBy === workerId,
    );

    if (!pausedGoal) {
      this.logger.error(
        "[LocalResumeWorkGateway] No paused goal found for worker",
        undefined,
        {
          workerId,
          pausedGoalsCount: pausedGoals.length,
          allClaimedBy: pausedGoals.map((g) => g.claimedBy),
        },
      );

      throw new Error("No paused goal found for current worker");
    }

    this.logger.info("[LocalResumeWorkGateway] Found paused goal for worker", {
      goalId: pausedGoal.goalId,
      objective: pausedGoal.objective,
    });

    // 4. Delegate goal state transition to atomic command handler
    const goalContextView = await this.resumeGoalCommandHandler.execute({
      goalId: pausedGoal.goalId,
    });

    // 5. Assemble base session context
    const baseContext = await this.sessionContextQueryHandler.execute();

    // 6. Build resume-specific instructions
    const instructions = this.buildResumeInstructions(baseContext);

    // 7. Return enriched response
    return {
      goalId: pausedGoal.goalId,
      objective: goalContextView.goal.objective,
      goalContextView,
      context: {
        ...baseContext,
        instructions,
        scope: "work-resume",
      },
    };
  }

  private buildResumeInstructions(view: ContextualSessionView): string[] {
    const instructions: string[] = [];

    instructions.push("resume-continuation-prompt");

    if (view.context.pausedGoals.length > 0) {
      instructions.push("paused-goals-context");
    }

    return instructions;
  }
}
