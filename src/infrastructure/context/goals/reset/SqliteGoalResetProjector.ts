/**
 * SqliteGoalResetProjector - SQLite projector for GoalResetEvent.
 *
 * Implements IGoalResetProjector for projecting goal reset events
 * to the SQLite read model, and IGoalResetReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalResetProjector } from "../../../../application/context/goals/reset/IGoalResetProjector.js";
import { IGoalResetReader } from "../../../../application/context/goals/reset/IGoalResetReader.js";
import { GoalResetEvent } from "../../../../domain/goals/reset/GoalResetEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalResetProjector
  implements IGoalResetProjector, IGoalResetReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalReset(event: GoalResetEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          note = NULL,
          reviewIssues = NULL,
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

  async findById(goalId: string): Promise<GoalView | null> {
    const row = this.db
      .prepare("SELECT *, goalId AS id FROM goal_views WHERE goalId = ?")
      .get(goalId) as GoalRecord | undefined;
    return row ? this.mapper.toView(row) : null;
  }
}
