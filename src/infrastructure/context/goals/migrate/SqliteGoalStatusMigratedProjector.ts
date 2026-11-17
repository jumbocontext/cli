/**
 * SqliteGoalStatusMigratedProjector - SQLite projector for GoalStatusMigratedEvent.
 *
 * Implements IGoalStatusMigratedProjector for projecting goal status migration events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IGoalStatusMigratedProjector } from "../../../../application/context/goals/migrate/IGoalStatusMigratedProjector.js";
import { GoalStatusMigratedEvent } from "../../../../domain/goals/migrate/GoalStatusMigratedEvent.js";

export class SqliteGoalStatusMigratedProjector implements IGoalStatusMigratedProjector {
  constructor(private db: Database) {}

  async applyGoalStatusMigrated(event: GoalStatusMigratedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
        AND status = ?
    `);

    stmt.run(
      event.payload.status,
      event.version,
      event.timestamp,
      event.aggregateId,
      event.payload.fromStatus,
    );
  }
}
