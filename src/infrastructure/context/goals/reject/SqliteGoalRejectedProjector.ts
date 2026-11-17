/**
 * SqliteGoalRejectedProjector - SQLite projector for GoalRejectedEvent.
 *
 * Implements IGoalRejectedProjector for projecting goal rejected events
 * to the SQLite read model, and IGoalRejectReader for reading goal data.
 * Clears claim fields when rejecting (review complete, claim released).
 * Stores review issues in the dedicated reviewIssues column for the implementing agent to reference.
 */

import { Database } from "better-sqlite3";
import { IGoalRejectedProjector } from "../../../../application/context/goals/reject/IGoalRejectedProjector.js";
import { IGoalRejectReader } from "../../../../application/context/goals/reject/IGoalRejectReader.js";
import { GoalRejectedEvent } from "../../../../domain/goals/reject/GoalRejectedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalRejectedProjector
  implements IGoalRejectedProjector, IGoalRejectReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalRejected(event: GoalRejectedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          reviewIssues = ?,
          claimedBy = NULL,
          claimedAt = NULL,
          claimExpiresAt = NULL,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.payload.reviewIssues,
      event.version,
      event.timestamp,
      event.aggregateId,
    );
  }

  async findById(goalId: string): Promise<GoalView | null> {
    const row = this.db
      .prepare("SELECT *, goalId AS id FROM goal_views WHERE goalId = ?")
      .get(goalId) as GoalRecord | undefined;
    return row ? this.mapper.toView(row) : null;
  }
}
