/**
 * Audience domain constants: event types, error messages, and limits.
 * Centralized location for all audience-related constants.
 */

// Audience event types
export const AudienceEventType = {
  ADDED: "AudienceAddedEvent",
  UPDATED: "AudienceUpdatedEvent",
  REMOVED: "AudienceRemovedEvent",
} as const;

export type AudienceEventTypeValue =
  (typeof AudienceEventType)[keyof typeof AudienceEventType];

// Priority enum
export const AudiencePriority = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
} as const;

export type AudiencePriorityType =
  (typeof AudiencePriority)[keyof typeof AudiencePriority];

// Error messages
export const AudienceErrorMessages = {
  ALREADY_EXISTS: "Audience already exists",
  NOT_FOUND: "Audience must exist before updating or removing",
  NOT_FOUND_WITH_ID: "Audience not found: {id}",
  ALREADY_REMOVED: "Audience has already been removed",
  NAME_REQUIRED: "Audience name must be provided",
  NAME_TOO_LONG: "Audience name must be less than {max} characters",
  DESCRIPTION_REQUIRED: "Audience description must be provided",
  DESCRIPTION_TOO_LONG:
    "Audience description must be less than {max} characters",
  INVALID_PRIORITY: "Priority must be one of: primary, secondary, tertiary",
  NO_CHANGES: "No changes detected for update",
} as const;

// Numeric limits
export const AudienceLimits = {
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
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
