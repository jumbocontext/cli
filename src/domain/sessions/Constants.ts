/**
 * Session domain constants.
 * Defines event types, status values, error messages, and validation limits.
 */

// Session event types
export const SessionEventType = {
  STARTED: "SessionStartedEvent",
  ENDED: "SessionEndedEvent",
} as const;

export type SessionEventTypeValue =
  (typeof SessionEventType)[keyof typeof SessionEventType];

// Session status
export const SessionStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  BLOCKED: "blocked",
  ENDED: "ended",
} as const;

export type SessionStatusType =
  (typeof SessionStatus)[keyof typeof SessionStatus];

// Error messages
export const SessionErrorMessages = {
  FOCUS_REQUIRED: "Session focus must be provided",
  FOCUS_TOO_LONG: "Session focus must be less than {max} characters",
  SUMMARY_TOO_LONG: "Session summary must be less than {max} characters",
  ALREADY_STARTED: "Session is already started",
  NOT_ACTIVE: "Session is not active",
  NO_ACTIVE_SESSION: "No active session found",
  SESSION_ALREADY_ENDED: "Session has already ended",
} as const;

// Numeric limits
export const SessionLimits = {
  FOCUS_MAX_LENGTH: 200,
  SUMMARY_MAX_LENGTH: 1000,
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
