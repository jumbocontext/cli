/**
 * SqliteGoalApprovedProjector - SQLite projector for GoalApprovedEvent.
 *
 * Implements IGoalApprovedProjector for projecting goal approved events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IGoalApprovedProjector } from "../../../../application/context/goals/approve/IGoalApprovedProjector.js";
import { GoalApprovedEvent } from "../../../../domain/goals/approve/GoalApprovedEvent.js";

export class SqliteGoalApprovedProjector implements IGoalApprovedProjector {
  constructor(private db: Database) {}

  async applyGoalApproved(event: GoalApprovedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          claimedBy = NULL,
          claimedAt = NULL,
          claimExpiresAt = NULL,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.version,
      event.timestamp,
      event.aggregateId,
    );
  }
}
