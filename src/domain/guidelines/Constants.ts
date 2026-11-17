/**
 * Guideline domain constants: event types, categories, error messages, and limits.
 * Centralized location for all guideline-related constants.
 */

// Guideline event types
export const GuidelineEventType = {
  ADDED: "GuidelineAddedEvent",
  UPDATED: "GuidelineUpdatedEvent",
  REMOVED: "GuidelineRemovedEvent",
} as const;

export type GuidelineEventTypeValue =
  (typeof GuidelineEventType)[keyof typeof GuidelineEventType];

// Guideline categories
export const GuidelineCategory = {
  TESTING: "testing",
  CODING_STYLE: "codingStyle",
  PROCESS: "process",
  COMMUNICATION: "communication",
  DOCUMENTATION: "documentation",
  SECURITY: "security",
  PERFORMANCE: "performance",
  OTHER: "other",
} as const;

export type GuidelineCategoryValue =
  (typeof GuidelineCategory)[keyof typeof GuidelineCategory];

// Error messages
export const GuidelineErrorMessages = {
  CATEGORY_REQUIRED: "Guideline category must be provided",
  CATEGORY_INVALID:
    "Category must be one of: testing, codingStyle, process, communication, documentation, security, performance, other",
  TITLE_REQUIRED: "Guideline title must be provided",
  TITLE_TOO_LONG: "Title must be less than {max} characters",
  DESCRIPTION_REQUIRED: "Guideline description must be provided",
  DESCRIPTION_TOO_LONG: "Description must be less than {max} characters",
  RATIONALE_REQUIRED: "Guideline rationale must be provided",
  RATIONALE_TOO_LONG: "Rationale must be less than {max} characters",
  EXAMPLE_PATH_TOO_LONG: "Example path must be less than {max} characters",
  TOO_MANY_EXAMPLES: "Cannot have more than {max} example paths",
  NO_CHANGES: "No changes provided for update",
  NOT_FOUND: "Guideline with ID {id} not found",
  ALREADY_REMOVED: "Guideline is already removed",
  ID_REQUIRED: "Guideline ID must be provided",
} as const;

// Numeric limits
export const GuidelineLimits = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  RATIONALE_MAX_LENGTH: 1000,
  EXAMPLE_PATH_MAX_LENGTH: 500,
  MAX_EXAMPLES: 10,
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
