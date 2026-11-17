/**
 * Constants for ValueProposition aggregate
 * Centralizes event types, error messages, and limits
 */

// Event types
export const ValuePropositionEventType = {
  ADDED: "ValuePropositionAddedEvent",
  UPDATED: "ValuePropositionUpdatedEvent",
  REMOVED: "ValuePropositionRemovedEvent",
} as const;

export type ValuePropositionEventTypeValue =
  (typeof ValuePropositionEventType)[keyof typeof ValuePropositionEventType];

// Error messages
export const ValuePropositionErrorMessages = {
  TITLE_REQUIRED: "Value proposition title must be provided",
  TITLE_TOO_LONG: "Title must be less than {max} characters",
  DESCRIPTION_REQUIRED: "Description must be provided",
  DESCRIPTION_TOO_LONG: "Description must be less than {max} characters",
  BENEFIT_REQUIRED: "Benefit must be provided",
  BENEFIT_TOO_LONG: "Benefit must be less than {max} characters",
  MEASURABLE_OUTCOME_TOO_LONG:
    "Measurable outcome must be less than {max} characters",
  NOT_FOUND: "Value proposition with ID {id} not found",
  NO_CHANGES: "At least one field must be provided for update",
} as const;

// Numeric limits
export const ValuePropositionLimits = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  BENEFIT_MAX_LENGTH: 500,
  MEASURABLE_OUTCOME_MAX_LENGTH: 500,
} as const;

// Helper function for message formatting
export function formatErrorMessage(
  template: string,
  replacements: Record<string, string | number>,
): string {
  return Object.entries(replacements).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}
