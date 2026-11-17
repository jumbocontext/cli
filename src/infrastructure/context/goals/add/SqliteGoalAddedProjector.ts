/**
 * SqliteGoalAddedProjector - SQLite projector for GoalAddedEvent.
 *
 * Implements IGoalAddedProjector for projecting goal addition events
 * to the SQLite read model.
 */

import { Database } from "better-sqlite3";
import { IGoalAddedProjector } from "../../../../application/context/goals/add/IGoalAddedProjector.js";
import { GoalAddedEvent } from "../../../../domain/goals/add/GoalAddedEvent.js";

export class SqliteGoalAddedProjector implements IGoalAddedProjector {
  constructor(private db: Database) {}

  async applyGoalAdded(event: GoalAddedEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO goal_views (
        goalId, title, objective, successCriteria, scopeIn, scopeOut,
        status, version, createdAt, updatedAt,
        claimedBy, claimedAt, claimExpiresAt,
        nextGoalId, progress, prerequisiteGoals,
        branch, worktree
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.aggregateId,
      event.payload.title,
      event.payload.objective,
      JSON.stringify(event.payload.successCriteria),
      JSON.stringify(event.payload.scopeIn),
      JSON.stringify(event.payload.scopeOut),
      event.payload.status,
      event.version,
      event.timestamp,
      event.timestamp,
      null, // claimedBy - goals are not claimed when added
      null, // claimedAt
      null, // claimExpiresAt
      event.payload.nextGoalId ?? null,
      JSON.stringify([]), // progress - initialized as empty array
      event.payload.prerequisiteGoals
        ? JSON.stringify(event.payload.prerequisiteGoals)
        : null,
      event.payload.branch ?? null,
      event.payload.worktree ?? null,
    );
  }
}
