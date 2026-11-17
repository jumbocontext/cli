// Event types
export const AudiencePainEventType = {
  ADDED: "AudiencePainAddedEvent",
  UPDATED: "AudiencePainUpdatedEvent",
} as const;

export type AudiencePainEventTypeValue =
  (typeof AudiencePainEventType)[keyof typeof AudiencePainEventType];

// Error messages
export const AudiencePainErrorMessages = {
  TITLE_REQUIRED: "Pain title must be provided",
  TITLE_TOO_LONG: "Pain title must be less than {max} characters",
  DESCRIPTION_REQUIRED: "Pain description must be provided",
  DESCRIPTION_TOO_LONG: "Pain description must be less than {max} characters",
  NOT_FOUND: "Audience pain not found",
  NO_CHANGES: "No changes provided for update",
} as const;

// Numeric limits
export const AudiencePainLimits = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
} as const;

// Status enum
export const AudiencePainStatus = {
  ACTIVE: "active",
} as const;

export type AudiencePainStatusType =
  (typeof AudiencePainStatus)[keyof typeof AudiencePainStatus];

// Helper function
export function formatErrorMessage(
  template: string,
  replacements: Record<string, string | number>,
): string {
  return Object.entries(replacements).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template,
  );
}
