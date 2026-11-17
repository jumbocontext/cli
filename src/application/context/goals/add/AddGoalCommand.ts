/**
 * Command to define a new goal.
 * Represents the user's intent to create a goal aggregate.
 *
 * Note: goalId is NOT included - the handler owns ID generation
 * as part of orchestration (Clean Architecture principle).
 */
export interface AddGoalCommand {
  readonly title: string;
  readonly objective: string;
  readonly successCriteria: string[];
  readonly scopeIn?: string[];
  readonly scopeOut?: string[];
  readonly nextGoalId?: string; // Sets NextGoal on this new goal
  readonly previousGoalId?: string; // Updates the referenced goal's NextGoal to point to this new goal
  readonly prerequisiteGoals?: string[]; // Goals that must be completed before this goal can start
  readonly branch?: string; // Git branch for multi-agent collaboration
  readonly worktree?: string; // Git worktree path for multi-agent collaboration
}
