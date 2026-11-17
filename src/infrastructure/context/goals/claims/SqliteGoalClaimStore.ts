/**
 * SqliteGoalClaimStore - SQLite-based goal claim persistence
 *
 * Stores goal claims in the goal_views table's claim columns (claimedBy,
 * claimedAt, claimExpiresAt). Claims are co-located with goal projections,
 * satisfying the RFC requirement that claims are managed by the storage
 * provider rather than file-based.
 */

import { Database } from "better-sqlite3";
import { IGoalClaimStore } from "../../../../application/context/goals/claims/IGoalClaimStore.js";
import { GoalClaim } from "../../../../application/context/goals/claims/GoalClaim.js";
import { WorkerId } from "../../../../application/host/workers/WorkerId.js";

export class SqliteGoalClaimStore implements IGoalClaimStore {
  constructor(private readonly db: Database) {}

  getClaim(goalId: string): GoalClaim | null {
    const row = this.db
      .prepare(
        "SELECT claimedBy, claimedAt, claimExpiresAt FROM goal_views WHERE goalId = ?",
      )
      .get(goalId) as
      | {
          claimedBy: string | null;
          claimedAt: string | null;
          claimExpiresAt: string | null;
        }
      | undefined;

    if (!row || !row.claimedBy || !row.claimedAt || !row.claimExpiresAt) {
      return null;
    }

    return {
      goalId,
      claimedBy: row.claimedBy as WorkerId,
      claimedAt: row.claimedAt,
      claimExpiresAt: row.claimExpiresAt,
    };
  }

  setClaim(claim: GoalClaim): void {
    this.db
      .prepare(
        "UPDATE goal_views SET claimedBy = ?, claimedAt = ?, claimExpiresAt = ? WHERE goalId = ?",
      )
      .run(
        claim.claimedBy,
        claim.claimedAt,
        claim.claimExpiresAt,
        claim.goalId,
      );
  }

  releaseClaim(goalId: string): void {
    this.db
      .prepare(
        "UPDATE goal_views SET claimedBy = NULL, claimedAt = NULL, claimExpiresAt = NULL WHERE goalId = ?",
      )
      .run(goalId);
  }
}
