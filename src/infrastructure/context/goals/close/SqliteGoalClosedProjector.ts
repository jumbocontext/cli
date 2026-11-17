/**
 * SqliteGoalClosedProjector - SQLite projector for GoalClosedEvent.
 *
 * Implements IGoalClosedProjector for projecting goal closed events
 * to the SQLite read model, and IGoalCloseReader for reading goal data.
 * Clears claim fields when closing (codification complete, claim released).
 */

import { Database } from "better-sqlite3";
import { IGoalClosedProjector } from "../../../../application/context/goals/close/IGoalClosedProjector.js";
import { IGoalCloseReader } from "../../../../application/context/goals/close/IGoalCloseReader.js";
import { GoalClosedEvent } from "../../../../domain/goals/close/GoalClosedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalClosedProjector
  implements IGoalClosedProjector, IGoalCloseReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalClosed(event: GoalClosedEvent): Promise<void> {
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

  async findById(goalId: string): Promise<GoalView | null> {
    const row = this.db
      .prepare("SELECT *, goalId AS id FROM goal_views WHERE goalId = ?")
      .get(goalId) as GoalRecord | undefined;
    return row ? this.mapper.toView(row) : null;
  }
}
