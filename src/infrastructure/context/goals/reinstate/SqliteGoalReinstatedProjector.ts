import { Database } from "better-sqlite3";
import { IGoalReinstatedProjector } from "../../../../application/context/goals/reinstate/IGoalReinstatedProjector.js";
import { GoalReinstatedEvent } from "../../../../domain/goals/reinstate/GoalReinstatedEvent.js";

export class SqliteGoalReinstatedProjector implements IGoalReinstatedProjector {
  constructor(private readonly db: Database) {}

  async applyGoalReinstated(event: GoalReinstatedEvent): Promise<void> {
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
