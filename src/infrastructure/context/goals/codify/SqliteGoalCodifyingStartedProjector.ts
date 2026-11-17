/**
 * SqliteGoalCodifyingStartedProjector - SQLite projector for GoalCodifyingStartedEvent.
 *
 * Implements IGoalCodifyingStartedProjector for projecting goal codifying started events
 * to the SQLite read model, and IGoalCodifyReader for reading goal data.
 * Sets claim fields when codifying (claim acquired).
 */

import { Database } from "better-sqlite3";
import { IGoalCodifyingStartedProjector } from "../../../../application/context/goals/codify/IGoalCodifyingStartedProjector.js";
import { IGoalCodifyReader } from "../../../../application/context/goals/codify/IGoalCodifyReader.js";
import { GoalCodifyingStartedEvent } from "../../../../domain/goals/codify/GoalCodifyingStartedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalCodifyingStartedProjector
  implements IGoalCodifyingStartedProjector, IGoalCodifyReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalCodifyingStarted(
    event: GoalCodifyingStartedEvent,
  ): Promise<void> {
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
