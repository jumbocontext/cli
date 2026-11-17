/**
 * SqliteGoalCommittedProjector - SQLite projector for GoalCommittedEvent.
 *
 * Implements IGoalCommittedProjector for projecting goal committed events
 * to the SQLite read model, and IGoalCommitReader for reading goal data.
 * Clears claim fields when committing (refinement complete, claim released).
 */

import { Database } from "better-sqlite3";
import { IGoalCommittedProjector } from "../../../../application/context/goals/commit/IGoalCommittedProjector.js";
import { IGoalCommitReader } from "../../../../application/context/goals/commit/IGoalCommitReader.js";
import { GoalCommittedEvent } from "../../../../domain/goals/commit/GoalCommittedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalCommittedProjector
  implements IGoalCommittedProjector, IGoalCommitReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalCommitted(event: GoalCommittedEvent): Promise<void> {
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
