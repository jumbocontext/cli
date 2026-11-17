/**
 * SqliteGoalSubmittedForReviewProjector - SQLite projector for GoalSubmittedForReviewEvent.
 *
 * Implements IGoalSubmittedForReviewProjector for projecting goal submitted for review events
 * to the SQLite read model, and IGoalSubmitForReviewReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalSubmittedForReviewProjector } from "../../../../application/context/goals/review/IGoalSubmittedForReviewProjector.js";
import { IGoalSubmitForReviewReader } from "../../../../application/context/goals/review/IGoalSubmitForReviewReader.js";
import { GoalSubmittedForReviewEvent } from "../../../../domain/goals/review/GoalSubmittedForReviewEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalSubmittedForReviewProjector
  implements IGoalSubmittedForReviewProjector, IGoalSubmitForReviewReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalSubmittedForReview(
    event: GoalSubmittedForReviewEvent,
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
      event.payload.claimedBy ?? null,
      event.payload.claimedAt ?? null,
      event.payload.claimExpiresAt ?? null,
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
