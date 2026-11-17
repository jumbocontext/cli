/**
 * SqliteGoalCompletedProjector - SQLite projector for GoalCompletedEvent.
 *
 * Implements IGoalCompletedProjector for projecting goal completed events
 * to the SQLite read model, and IGoalCompleteReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalCompletedProjector } from "../../../../application/context/goals/complete/IGoalCompletedProjector.js";
import { IGoalCompleteReader } from "../../../../application/context/goals/complete/IGoalCompleteReader.js";
import { GoalCompletedEvent } from "../../../../domain/goals/complete/GoalCompletedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalCompletedProjector
  implements IGoalCompletedProjector, IGoalCompleteReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalCompleted(event: GoalCompletedEvent): Promise<void> {
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
