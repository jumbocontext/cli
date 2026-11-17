/**
 * Reasons why a goal might be paused.
 * Provides context for goal suspension.
 */

export const GoalPausedReasons = {
  ContextCompressed: "ContextCompressed",
  WorkPaused: "WorkPaused",
  Other: "Other",
} as const;

export type GoalPausedReasonsType =
  (typeof GoalPausedReasons)[keyof typeof GoalPausedReasons];
