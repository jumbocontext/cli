/**
 * SqliteGoalSubmittedProjector - SQLite projector for GoalSubmittedEvent.
 *
 * Implements IGoalSubmittedProjector for projecting goal submitted events
 * to the SQLite read model, and IGoalSubmitReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalSubmittedProjector } from "../../../../application/context/goals/submit/IGoalSubmittedProjector.js";
import { IGoalSubmitReader } from "../../../../application/context/goals/submit/IGoalSubmitReader.js";
import { GoalSubmittedEvent } from "../../../../domain/goals/submit/GoalSubmittedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalSubmittedProjector
  implements IGoalSubmittedProjector, IGoalSubmitReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalSubmitted(event: GoalSubmittedEvent): Promise<void> {
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
