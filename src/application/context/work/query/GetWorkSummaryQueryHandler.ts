import { IActiveSessionReader } from "../../sessions/end/IActiveSessionReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { WorkSummaryView } from "../views/WorkSummaryView.js";

/**
 * GetWorkSummaryQueryHandler - Query handler for aggregated work status
 *
 * Retrieves session and goal information for the CLI variable content section.
 * Aggregates data from session and goal projection stores.
 *
 * Usage:
 *   const query = new GetWorkSummaryQueryHandler(activeSessionReader, goalStatusReader);
 *   const summary = await query.execute();
 *   // Render variable content with session status, goal counts, blockers
 */
export class GetWorkSummaryQueryHandler {
  constructor(
    private readonly activeSessionReader: IActiveSessionReader,
    private readonly goalStatusReader: IGoalStatusReader,
  ) {}

  /**
   * Execute query to get work summary for display
   *
   * @returns WorkSummaryView with session, goal counts, and blockers
   */
  async execute(): Promise<WorkSummaryView> {
    // Query all projection stores in parallel for efficiency
    const [
      activeSession,
      plannedGoals,
      activeGoals,
      blockedGoals,
      completedGoals,
    ] = await Promise.all([
      this.activeSessionReader.findActive(),
      this.goalStatusReader.findByStatus(GoalStatus.TODO),
      this.goalStatusReader.findByStatus(GoalStatus.DOING),
      this.goalStatusReader.findByStatus(GoalStatus.BLOCKED),
      this.goalStatusReader.findByStatus(GoalStatus.COMPLETED),
    ]);

    return {
      session: activeSession
        ? {
            sessionId: activeSession.sessionId,
            focus: activeSession.focus,
            status: activeSession.status,
            startedAt: activeSession.startedAt,
          }
        : null,
      goals: {
        planned: plannedGoals.length,
        active: activeGoals.length,
        blocked: blockedGoals.length,
        completed: completedGoals.length,
      },
      blockers: blockedGoals.map((goal) => ({
        goalId: goal.goalId,
        objective: goal.objective,
        note: goal.note ?? "No details provided",
      })),
    };
  }
}
