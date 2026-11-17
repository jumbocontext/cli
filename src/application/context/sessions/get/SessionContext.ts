import { GoalView } from "../../goals/GoalView.js";
import { DecisionView } from "../../decisions/DecisionView.js";
import { ProjectView } from "../../project/ProjectView.js";

/**
 * SessionContext - Pure context container for session orientation.
 *
 * Holds only the contextual data that provides orientation for a session:
 * project context, goals by category, and recent decisions.
 *
 * Does NOT contain the session itself. The composed return type
 * ContextualSessionView pairs a SessionView with its SessionContext.
 *
 * Assembled at query time from multiple view readers using the multi-query pattern.
 * No dependency on event-sourced projections — all data is current state from existing read models.
 */
export interface SessionContext {
  /**
   * Core project context.
   * Null if project hasn't been initialized.
   */
  readonly projectContext: ProjectView | null;

  /**
   * Goals currently being actively worked on (status='doing'/'blocked'/'in-review'/'qualified').
   */
  readonly activeGoals: GoalView[];

  /**
   * Goals that are paused (status='paused').
   * Separated from activeGoals for enricher detection (paused-goals-resume signal).
   */
  readonly pausedGoals: GoalView[];

  /**
   * Goals available to work on next (status='to-do'/'refined').
   */
  readonly plannedGoals: GoalView[];

  /**
   * Recent active decisions for context orientation.
   */
  readonly recentDecisions: DecisionView[];
}
