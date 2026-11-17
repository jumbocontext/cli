/**
 * SqliteGoalUnblockedProjector - SQLite projector for GoalUnblockedEvent.
 *
 * Implements IGoalUnblockedProjector for projecting goal unblocked events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IGoalUnblockedProjector } from "../../../../application/context/goals/unblock/IGoalUnblockedProjector.js";
import { GoalUnblockedEvent } from "../../../../domain/goals/unblock/GoalUnblockedEvent.js";

export class SqliteGoalUnblockedProjector implements IGoalUnblockedProjector {
  constructor(private db: Database) {}

  async applyGoalUnblocked(event: GoalUnblockedEvent): Promise<void> {
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
      event.payload.note || null,
      event.version,
      event.timestamp,
      event.aggregateId,
    );
  }
}
