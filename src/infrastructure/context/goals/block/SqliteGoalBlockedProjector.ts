/**
 * SqliteGoalBlockedProjector - SQLite projector for GoalBlockedEvent.
 *
 * Implements IGoalBlockedProjector for projecting goal blocked events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IGoalBlockedProjector } from "../../../../application/context/goals/block/IGoalBlockedProjector.js";
import { GoalBlockedEvent } from "../../../../domain/goals/block/GoalBlockedEvent.js";

export class SqliteGoalBlockedProjector implements IGoalBlockedProjector {
  constructor(private db: Database) {}

  async applyGoalBlocked(event: GoalBlockedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          note = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.payload.note,
      event.version,
      event.timestamp,
      event.aggregateId,
    );
  }
}
