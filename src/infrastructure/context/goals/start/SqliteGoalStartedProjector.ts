/**
 * SqliteGoalStartedProjector - SQLite projector for GoalStartedEvent.
 *
 * Implements IGoalStartedProjector for projecting goal started events
 * to the SQLite read model, and IGoalReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalStartedProjector } from "../../../../application/context/goals/start/IGoalStartedProjector.js";
import { IGoalReader } from "../../../../application/context/goals/start/IGoalReader.js";
import { GoalStartedEvent } from "../../../../domain/goals/start/GoalStartedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalStartedProjector
  implements IGoalStartedProjector, IGoalReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalStarted(event: GoalStartedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          claimedBy = ?,
          claimedAt = ?,
          claimExpiresAt = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
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
