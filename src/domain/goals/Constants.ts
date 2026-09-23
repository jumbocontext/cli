/**
 * Domain constants for Goal aggregate.
 * Centralizes event types, status values, error messages, and limits.
 */

// Goal event types
export const GoalEventType = {
  ADDED: 'GoalAddedEvent',
  REFINED: 'GoalRefinedEvent',
  STARTED: 'GoalStartedEvent',
  UPDATED: 'GoalUpdatedEvent',
  BLOCKED: 'GoalBlockedEvent',
  UNBLOCKED: 'GoalUnblockedEvent',
  PAUSED: 'GoalPausedEvent',
  POSTPONED: 'GoalPostponedEvent',
  REINSTATED: 'GoalReinstatedEvent',
  RESUMED: 'GoalResumedEvent',
  COMPLETED: 'GoalCompletedEvent',
  RESET: 'GoalResetEvent',
  REMOVED: 'GoalRemovedEvent',
  PROGRESS_UPDATED: 'GoalProgressUpdatedEvent',
  SUBMITTED_FOR_REVIEW: 'GoalSubmittedForReviewEvent',
  QUALIFIED: 'GoalQualifiedEvent',
  REFINEMENT_STARTED: 'GoalRefinementStartedEvent',
  COMMITTED: 'GoalCommittedEvent',
  REJECTED: 'GoalRejectedEvent',
  SUBMITTED: 'GoalSubmittedEvent',
  CODIFYING_STARTED: 'GoalCodifyingStartedEvent',
  CLOSED: 'GoalClosedEvent',
  APPROVED: 'GoalApprovedEvent',
  STATUS_MIGRATED: 'GoalStatusMigratedEvent'
} as const;

export type GoalEventTypeValue = typeof GoalEventType[keyof typeof GoalEventType];

// Goal status enum
export const GoalStatus = {
  TODO: 'defined',
  REFINED: 'refined',
  DOING: 'doing',
  BLOCKED: 'blocked',
  PAUSED: 'paused',
  POSTPONED: 'postponed',
  COMPLETED: 'done',
  INREVIEW: 'in-review',
  QUALIFIED: 'approved',
  IN_REFINEMENT: 'in-refinement',
  REJECTED: 'rejected',
  UNBLOCKED: 'unblocked',
  SUBMITTED: 'submitted',
  CODIFYING: 'codifying',
  DONE: 'done',
} as const;

export type GoalStatusType = typeof GoalStatus[keyof typeof GoalStatus];

// Error messages
export const GoalErrorMessages = {
  ALREADY_DEFINED: 'Goal has already been defined',
  OBJECTIVE_REQUIRED: 'Goal objective must be provided',
  OBJECTIVE_TOO_LONG: 'Objective must be less than {max} characters',
  TITLE_REQUIRED: 'Goal title must be provided',
  TITLE_TOO_LONG: 'Title must be less than {max} characters',
  SUCCESS_CRITERIA_REQUIRED: 'At least one success criterion must be provided',
  SUCCESS_CRITERION_TOO_LONG: 'Success criterion must be less than {max} characters',
  TOO_MANY_CRITERIA: 'Cannot have more than {max} success criteria',
  SCOPE_ITEM_TOO_LONG: 'Scope item must be less than {max} characters',
  TOO_MANY_SCOPE_ITEMS: 'Cannot have more than {max} scope items',
  GOAL_NOT_FOUND: 'Goal not found: {id}',
  CANNOT_START_BLOCKED: 'Cannot start a blocked goal. Unblock it first.',
  CANNOT_START_COMPLETED: 'Cannot start a done goal.',
  CANNOT_START_NOT_REFINED: 'Cannot start goal. Goal must be refined first.',
  CANNOT_REFINE_IN_STATUS: 'Cannot refine goal in {status} status. Goal must be in defined status.',
  ALREADY_REFINED: 'Goal is already refined.',
  NOT_FOUND: 'Goal with ID {goalId} not found',
  NO_CHANGES_PROVIDED: 'At least one field must be provided for update',
  CANNOT_UPDATE_COMPLETED: 'Cannot update a done goal',
  NOTE_REQUIRED: 'Note is required when blocking a goal',
  NOTE_TOO_LONG: 'Note must be less than {max} characters',
  CANNOT_BLOCK_IN_STATUS: 'Cannot block goal in {status} status. Goal must be in to-do or doing status.',
  CANNOT_UNBLOCK_IN_STATUS: 'Cannot unblock goal in {status} status. Goal must be blocked.',
  NOT_QUALIFIED: 'Cannot complete goal. Goal must be approved first.',
  ALREADY_COMPLETED: 'Goal is already done',
  QA_REVIEW_REQUIRED: 'At least one QA review is required before committing goal {goalId}.',
  CANNOT_RESET_BLOCKED: 'Cannot reset a blocked goal. Unblock it first to preserve blocker context.',
  ALREADY_TODO: 'Goal is already in defined status',
  CANNOT_PAUSE_IN_STATUS: 'Cannot pause goal in {status} status. Goal must be in doing status.',
  CANNOT_POSTPONE_IN_STATUS: 'Cannot postpone goal in {status} status. Goal must be in defined status.',
  CANNOT_REINSTATE_IN_STATUS: 'Cannot reinstate goal in {status} status. Goal must be in postponed status.',
  CANNOT_RESUME_IN_STATUS: 'Cannot resume goal in {status} status. Goal must be paused.',
  // Embedded context: file path errors
  FILE_PATH_TOO_LONG: 'File path must be less than {max} characters',
  // Claim-related errors
  GOAL_CLAIMED_BY_ANOTHER_WORKER: 'Goal is claimed by another worker. Claim expires at {expiresAt}.',
  // Review and qualification state transition errors
  CANNOT_SUBMIT_IN_STATUS: 'Cannot submit goal in {status} status. Goal must be in doing status.',
  CANNOT_SUBMIT_FOR_REVIEW_IN_STATUS: 'Cannot submit goal for review in {status} status. Goal must be in submitted status.',
  CANNOT_QUALIFY_IN_STATUS: 'Cannot approve goal in {status} status. Goal must be in-review.',
  ALREADY_IN_REFINEMENT: 'Goal is already in refinement.',
  CANNOT_COMMIT_IN_STATUS: 'Cannot commit goal in {status} status. Goal must be in in-refinement status.',
  CANNOT_REJECT_IN_STATUS: 'Cannot reject goal in {status} status. Goal must be in in-review status.',
  AUDIT_FINDINGS_REQUIRED: 'Audit findings are required when rejecting a goal.',
  CANNOT_CODIFY_IN_STATUS: 'Cannot codify goal in {status} status. Goal must be in approved status.',
  ALREADY_CODIFYING: 'Goal is already in codifying status.',
  CANNOT_CLOSE_IN_STATUS: 'Cannot close goal in {status} status. Goal must be in codifying status.',
  ALREADY_DONE: 'Goal is already done.',
  CANNOT_RESET_WAITING_STATE: 'Cannot reset goal. Goal is already in waiting state ({status}).',
  CANNOT_RESET_TO_IN_PROGRESS: 'Cannot reset to in-progress state. Reset targets must be waiting states.',
  PREREQUISITES_NOT_SATISFIED: 'Cannot start goal. The following prerequisites are not yet satisfied:\n{details}',
} as const;

// Numeric limits
export const GoalLimits = {
  TITLE_MAX_LENGTH: 60,
  OBJECTIVE_MAX_LENGTH: 1500,
  SUCCESS_CRITERION_MAX_LENGTH: 1000,
  MAX_SUCCESS_CRITERIA: 100,
  SCOPE_ITEM_MAX_LENGTH: 200,
  MAX_SCOPE_ITEMS: 100,
  NOTE_MAX_LENGTH: 500,
  // Embedded context: file path limits (only validation needed - other fields pre-validated by source aggregates)
  FILE_PATH_MAX_LENGTH: 500
} as const;

// State classification sets for reset logic
export const WAITING_STATES: ReadonlySet<GoalStatusType> = new Set([
  GoalStatus.TODO,
  GoalStatus.REFINED,
  GoalStatus.REJECTED,
  GoalStatus.UNBLOCKED,
  GoalStatus.SUBMITTED,
  GoalStatus.QUALIFIED,
  GoalStatus.PAUSED,
  GoalStatus.POSTPONED,
  GoalStatus.BLOCKED,
] as GoalStatusType[]);

export const IN_PROGRESS_STATES: ReadonlySet<GoalStatusType> = new Set([
  GoalStatus.IN_REFINEMENT,
  GoalStatus.DOING,
  GoalStatus.INREVIEW,
  GoalStatus.CODIFYING,
] as GoalStatusType[]);

export const TERMINAL_STATES: ReadonlySet<GoalStatusType> = new Set([
  GoalStatus.DONE,
  GoalStatus.COMPLETED,
] as GoalStatusType[]);

/**
 * Statuses that satisfy prerequisite requirements for goal start.
 * A prerequisite goal must be at SUBMITTED or later to allow dependent goals to start.
 */
export const SATISFIED_PREREQUISITE_STATUSES: ReadonlySet<GoalStatusType> = new Set([
  GoalStatus.SUBMITTED,
  GoalStatus.INREVIEW,
  GoalStatus.QUALIFIED,
  GoalStatus.CODIFYING,
  GoalStatus.DONE,
] as GoalStatusType[]);

/**
 * Deterministic reset targets for states with a single predecessor waiting state.
 * DOING is excluded because it has multiple entry points (REFINED, REJECTED, UNBLOCKED).
 * Note: DONE and COMPLETED both resolve to 'done' — single entry covers both.
 */
export const DETERMINISTIC_RESET_TARGETS: ReadonlyMap<GoalStatusType, GoalStatusType> = new Map([
  [GoalStatus.IN_REFINEMENT, GoalStatus.TODO],
  [GoalStatus.INREVIEW, GoalStatus.SUBMITTED],
  [GoalStatus.CODIFYING, GoalStatus.QUALIFIED],
  [GoalStatus.DONE, GoalStatus.QUALIFIED],
]);

// Helper function for message formatting
export function formatErrorMessage(
  template: string,
  replacements: Record<string, string | number>
): string {
  return Object.entries(replacements).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template
  );
}
