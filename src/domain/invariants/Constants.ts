/**
 * Invariant domain constants: event types, error messages, and limits.
 * Centralized location for all invariant-related constants.
 */

// Invariant event types
export const InvariantEventType = {
  ADDED: "InvariantAddedEvent",
  UPDATED: "InvariantUpdatedEvent",
  REMOVED: "InvariantRemovedEvent",
} as const;

export type InvariantEventTypeValue =
  (typeof InvariantEventType)[keyof typeof InvariantEventType];

// Error messages
export const InvariantErrorMessages = {
  NOT_FOUND: "Invariant not found",
  NO_CHANGES_PROVIDED: "At least one field must be provided to update",
  TITLE_REQUIRED: "Invariant title must be provided",
  TITLE_TOO_LONG: "Invariant title must be less than {max} characters",
  DESCRIPTION_REQUIRED: "Invariant description must be provided",
  DESCRIPTION_TOO_LONG:
    "Invariant description must be less than {max} characters",
  RATIONALE_TOO_LONG: "Rationale must be less than {max} characters",
} as const;

// Numeric limits
export const InvariantLimits = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  RATIONALE_MAX_LENGTH: 1000,
} as const;

/**
 * Helper function for formatting error messages with variable replacement.
 * Replaces {key} placeholders with corresponding values.
 *
 * @param template - Error message template with {key} placeholders
 * @param replacements - Object with key-value pairs for replacement
 * @returns Formatted error message
 */
export function formatErrorMessage(
  template: string,
  replacements: Record<string, string | number>,
): string {
  return Object.entries(replacements).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}
