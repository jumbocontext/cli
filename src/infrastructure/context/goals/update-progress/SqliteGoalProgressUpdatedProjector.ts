/**
 * SqliteGoalProgressUpdatedProjector - SQLite projector for GoalProgressUpdatedEvent.
 *
 * Implements IGoalProgressUpdatedProjector for projecting goal progress updated events
 * to the SQLite read model, and IGoalProgressUpdateReader for reading goal data.
 */

import { Database } from "better-sqlite3";
import { IGoalProgressUpdatedProjector } from "../../../../application/context/goals/update-progress/IGoalProgressUpdatedProjector.js";
import { IGoalProgressUpdateReader } from "../../../../application/context/goals/update-progress/IGoalProgressUpdateReader.js";
import { GoalProgressUpdatedEvent } from "../../../../domain/goals/update-progress/GoalProgressUpdatedEvent.js";

export class SqliteGoalProgressUpdatedProjector
  implements IGoalProgressUpdatedProjector, IGoalProgressUpdateReader
{
  constructor(private db: Database) {}

  async applyGoalProgressUpdated(
    event: GoalProgressUpdatedEvent,
  ): Promise<void> {
    // First, read the current progress array
    const selectStmt = this.db.prepare(`
      SELECT progress FROM goal_views WHERE goalId = ?
    `);
    const row = selectStmt.get(event.aggregateId) as
      { progress: string | null } | undefined;

    // Parse existing progress or start with empty array
    const currentProgress: string[] = row?.progress
      ? JSON.parse(row.progress)
      : [];

    // Append the new task description
    currentProgress.push(event.payload.taskDescription);

    // Update the goal view with the new progress array
    const updateStmt = this.db.prepare(`
      UPDATE goal_views
      SET progress = ?,
          version = ?,
          updatedAt = ?
      WHERE goalId = ?
    `);

    updateStmt.run(
      JSON.stringify(currentProgress),
      event.version,
      event.timestamp,
      event.aggregateId,
    );
  }

  async findById(
    goalId: string,
  ): Promise<{ goalId: string; status: string; progress: string[] } | null> {
    const row = this.db
      .prepare(
        "SELECT goalId, status, progress FROM goal_views WHERE goalId = ?",
      )
      .get(goalId) as
      { goalId: string; status: string; progress: string | null } | undefined;

    if (!row) {
      return null;
    }

    return {
      goalId: row.goalId,
      status: row.status,
      progress: JSON.parse(row.progress || "[]"),
    };
  }
}
