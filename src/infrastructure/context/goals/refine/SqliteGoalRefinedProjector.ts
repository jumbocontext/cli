/**
 * SqliteGoalRefinedProjector - SQLite projector for GoalRefinedEvent and GoalRefinementStartedEvent.
 *
 * Implements IGoalRefinedProjector for projecting goal refined events
 * to the SQLite read model, and IGoalRefineReader for reading goal data.
 *
 * Handles both:
 * - GoalRefinedEvent (backward compat replay of old events)
 * - GoalRefinementStartedEvent (new two-phase refinement with claims)
 */

import { Database } from "better-sqlite3";
import { IGoalRefinedProjector } from "../../../../application/context/goals/refine/IGoalRefinedProjector.js";
import { IGoalRefineReader } from "../../../../application/context/goals/refine/IGoalRefineReader.js";
import { GoalRefinedEvent } from "../../../../domain/goals/refine/GoalRefinedEvent.js";
import { GoalRefinementStartedEvent } from "../../../../domain/goals/refine/GoalRefinementStartedEvent.js";
import { GoalView } from "../../../../application/context/goals/GoalView.js";
import { GoalRecord } from "../GoalRecord.js";
import { GoalRecordMapper } from "../GoalRecordMapper.js";

export class SqliteGoalRefinedProjector
  implements IGoalRefinedProjector, IGoalRefineReader
{
  private readonly mapper = new GoalRecordMapper();

  constructor(private db: Database) {}

  async applyGoalRefined(event: GoalRefinedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE goal_views
      SET status = ?,
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

  async applyGoalRefinementStarted(
    event: GoalRefinementStartedEvent,
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
      event.payload.claimedBy,
      event.payload.claimedAt,
      event.payload.claimExpiresAt,
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
