/**
 * SqliteGoalPausedProjector - SQLite projector for GoalPausedEvent.
 *
 * Implements IGoalPausedProjector for projecting goal paused events
 * to the SQLite read model, and IGoalReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalPausedProjector } from "../../../../application/context/goals/pause/IGoalPausedProjector.js";
import { IGoalReader } from "../../../../application/context/goals/pause/IGoalReader.js";
import { IGoalPauseReader } from "../../../../application/context/goals/pause/IGoalPauseReader.js";
import { GoalPausedEvent } from "../../../../domain/goals/pause/GoalPausedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalPausedProjector
  implements IGoalPausedProjector, IGoalReader, IGoalPauseReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalPaused(event: GoalPausedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
          note = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    stmt.run(
      event.payload.status,
      event.payload.note || null,
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
