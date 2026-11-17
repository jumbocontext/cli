import { GoalStatusType } from "../../../domain/goals/Constants.js";

/**
 * Read model for Goal aggregate.
 * Represents the materialized view stored in SQLite.
 */
export interface GoalView {
  readonly goalId: string;
  readonly title: string;
  readonly objective: string;
  readonly successCriteria: string[];
  readonly scopeIn: string[];
  readonly scopeOut: string[];
  readonly status: GoalStatusType;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly note?: string; // Optional: populated when blocked or completed
  readonly reviewIssues?: string; // Optional: populated when rejected with review findings
  readonly progress: string[]; // Tracks completed sub-tasks (append-only)
  // Claim fields - populated when goal is started/resumed, cleared on complete/reset
  readonly claimedBy?: string; // WorkerId of the claiming worker
  readonly claimedAt?: string; // ISO 8601 timestamp when claim was created
  readonly claimExpiresAt?: string; // ISO 8601 timestamp when claim expires
  readonly nextGoalId?: string;
  readonly prerequisiteGoals?: string[];
  readonly branch?: string;
  readonly worktree?: string;
}
