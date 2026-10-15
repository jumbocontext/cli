/**
 * Domain constants for Decision aggregate.
 * Centralizes event types, status values, error messages, and limits.
 */

// Decision event types
export const DecisionEventType = {
  ADDED: 'DecisionAddedEvent',
  UPDATED: 'DecisionUpdatedEvent',
  REVERSED: 'DecisionReversedEvent',
  SUPERSEDED: 'DecisionSupersededEvent',
  RESTORED: 'DecisionRestoredEvent',
  REMOVED: 'DecisionRemovedEvent'
} as const;

export type DecisionEventTypeValue = typeof DecisionEventType[keyof typeof DecisionEventType];

// Decision status
export const DecisionStatus = {
  ACTIVE: 'active',
  REVERSED: 'reversed',
  SUPERSEDED: 'superseded',
  REMOVED: 'removed'
} as const;

export type DecisionStatusType = typeof DecisionStatus[keyof typeof DecisionStatus];

// Error messages
export const DecisionErrorMessages = {
  TITLE_REQUIRED: 'Decision title must be provided',
  TITLE_TOO_LONG: 'Decision title must be less than {max} characters',
  CONTEXT_REQUIRED: 'Decision context must be provided',
  CONTEXT_TOO_LONG: 'Decision context must be less than {max} characters',
  RATIONALE_TOO_LONG: 'Decision rationale must be less than {max} characters',
  CONSEQUENCES_TOO_LONG: 'Consequences must be less than {max} characters',
  ALTERNATIVE_TOO_LONG: 'Alternative must be less than {max} characters',
  TOO_MANY_ALTERNATIVES: 'Cannot have more than {max} alternatives',
  DECISION_NOT_FOUND: 'Decision with ID {id} not found',
  ALREADY_REVERSED: 'Decision is already reversed',
  ALREADY_SUPERSEDED: 'Decision is already superseded',
  ALREADY_ACTIVE: 'Decision is already active',
  ALREADY_REMOVED: 'Decision is already removed',
  CANNOT_MODIFY_REMOVED: 'Cannot modify a removed decision',
  CANNOT_MODIFY_INACTIVE: 'Cannot modify a reversed or superseded decision',
  REASON_REQUIRED: 'Reason for reversal must be provided',
  REASON_TOO_LONG: 'Reversal reason must be less than {max} characters',
  SUPERSEDED_BY_REQUIRED: 'SupersededBy decision ID must be provided'
} as const;

// Numeric limits
export const DecisionLimits = {
  TITLE_MAX_LENGTH: 200,
  CONTEXT_MAX_LENGTH: 2000,
  RATIONALE_MAX_LENGTH: 2000,
  CONSEQUENCES_MAX_LENGTH: 2000,
  ALTERNATIVE_MAX_LENGTH: 500,
  MAX_ALTERNATIVES: 10,
  REASON_MAX_LENGTH: 500
} as const;

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
