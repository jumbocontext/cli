import { GoalStatus } from "../../../domain/goals/Constants.js";

export const GOAL_STATUS_FILTER_ALL = "all";

export const GOAL_STATUS_FILTERS = [
  GOAL_STATUS_FILTER_ALL,
  GoalStatus.TODO,
  GoalStatus.POSTPONED,
  GoalStatus.IN_REFINEMENT,
  GoalStatus.REFINED,
  GoalStatus.DOING,
  GoalStatus.PAUSED,
  GoalStatus.BLOCKED,
  GoalStatus.UNBLOCKED,
  GoalStatus.SUBMITTED,
  GoalStatus.INREVIEW,
  GoalStatus.REJECTED,
  GoalStatus.QUALIFIED,
  GoalStatus.CODIFYING,
  GoalStatus.DONE,
] as const;

export type GoalStatusFilter = (typeof GOAL_STATUS_FILTERS)[number];

export const GoalsScreenCopy = {
  browserTitle: "GOALS//",
  newGoal: "new",
  loadingGoals: "Loading goals",
  loadingContext: "Loading goal context",
  emptyGoals: "No goals available",
  emptyFieldValue: "None",
  showingLabel: "Showing:",
  stateLineLabel: "State:",
  authoringUnavailable:
    "Goal registration is unavailable. Restart Jumbo and try again.",
  details: {
    id: "Id........",
    title: "Title.....",
    status: "Status....",
    objective: "Objective.",
    criteria: "Criteria",
    scopeIn: "In........",
    scopeOut: "Out.......",
    prerequisites: "Prereq....",
    progress: "Progress",
    note: "Note",
    reviewIssues: "Review issues",
    nextGoal: "Next goal",
    version: "Version...",
    createdAt: "Created...",
    updatedAt: "Updated...",
    branch: "Branch....",
    worktree: "Worktree..",
    claimedBy: "Claimed by",
    claimedAt: "Claimed at",
    claimExpiresAt: "Claim exp.",
    decisionContext: "Context...",
    decisionRationale: "Rationale.",
  },
  sections: {
    metadata: "META-DATA:",
    objective: "OBJECTIVE:",
    note: "NOTE:",
    reviewIssues: "REVIEW ISSUES:",
    successCriteria: "SUCCESS CRITERIA:",
    currentProgress: "CURRENT PROGRESS:",
    scope: "SCOPE:",
    relatedComponents: "RELATED COMPONENTS",
    relatedDependencies: "RELATED DEPENDENCIES",
    relatedDecisions: "RELATED DECISIONS",
    relatedInvariants: "RELATED INVARIANTS",
    relatedGuidelines: "RELATED GUIDELINES",
  },
} as const;

export const GOAL_SECTION_PAGE_SIZE = 6;
export const GOAL_DECISION_PAGE_SIZE = 2;
export const GOAL_RELATED_DESCRIPTION_MAX_LENGTH = 200;
export const GOAL_BROWSER_TITLE_MAX_LENGTH = 68;
