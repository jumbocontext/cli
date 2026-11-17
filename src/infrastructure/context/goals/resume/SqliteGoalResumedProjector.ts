/**
 * SqliteGoalResumedProjector - SQLite projector for GoalResumedEvent.
 *
 * Implements IGoalResumedProjector for projecting goal resumed events
 * to the SQLite read model, and IGoalReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalResumedProjector } from "../../../../application/context/goals/resume/IGoalResumedProjector.js";
import { IGoalReader } from "../../../../application/context/goals/resume/IGoalReader.js";
import { GoalResumedEvent } from "../../../../domain/goals/resume/GoalResumedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalResumedProjector
  implements IGoalResumedProjector, IGoalReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalResumed(event: GoalResumedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          note = ?,
          claimedBy = ?,
          claimedAt = ?,
          claimExpiresAt = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.payload.note || null,
      event.payload.claimedBy || null,
      event.payload.claimedAt || null,
      event.payload.claimExpiresAt || null,
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
