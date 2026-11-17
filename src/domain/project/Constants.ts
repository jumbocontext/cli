/**
 * Project domain constants: event types, error messages, and limits.
 * Centralized location for all project-related constants.
 */

// Project event types
export const ProjectEventType = {
  INITIALIZED: "ProjectInitializedEvent",
  UPDATED: "ProjectUpdatedEvent",
} as const;

export type ProjectEventTypeValue =
  (typeof ProjectEventType)[keyof typeof ProjectEventType];

// Project lifecycle states
export const ProjectLifecycle = {
  UNINITIALIZED: "uninitialized",
  UNPRIMED: "unprimed",
  PRIMED_EMPTY: "primed-empty",
  PRIMED: "primed",
} as const;

export type ProjectLifecycleValue =
  (typeof ProjectLifecycle)[keyof typeof ProjectLifecycle];

// Error messages
export const ProjectErrorMessages = {
  ALREADY_INITIALIZED: "Jumbo is already initialized",
  NOT_INITIALIZED:
    "Project must be initialized before updating. Run: jumbo project init",
  NO_CHANGES_PROVIDED:
    "No changes provided. Specify at least one field to update.",
  NAME_REQUIRED: "Project name must be provided",
  NAME_TOO_LONG: "Project name must be less than {max} characters",
  PURPOSE_TOO_LONG: "Purpose must be less than {max} characters",
} as const;

// Numeric limits
export const ProjectLimits = {
  NAME_MAX_LENGTH: 100,
  PURPOSE_MAX_LENGTH: 1000,
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
