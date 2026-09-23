import { Database } from "better-sqlite3";
import { IGoalPostponedProjector } from "../../../../application/context/goals/postpone/IGoalPostponedProjector.js";
import { GoalPostponedEvent } from "../../../../domain/goals/postpone/GoalPostponedEvent.js";

export class SqliteGoalPostponedProjector implements IGoalPostponedProjector {
  constructor(private readonly db: Database) {}

  async applyGoalPostponed(event: GoalPostponedEvent): Promise<void> {
    this.db.prepare(`
      UPDATE goal_views
      SET status = ?, version = ?, updatedAt = ?
      WHERE goalId = ?
    `).run(
      event.payload.status,
      event.version,
      event.timestamp,
      event.aggregateId
    );
  }

}
