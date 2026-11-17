// Dependency event types
export const DependencyEventType = {
  ADDED: "DependencyAddedEvent",
  UPDATED: "DependencyUpdatedEvent",
  REMOVED: "DependencyRemovedEvent",
} as const;

// Status enum
export const DependencyStatus = {
  ACTIVE: "active",
  DEPRECATED: "deprecated",
  REMOVED: "removed",
} as const;

export type DependencyStatusType =
  (typeof DependencyStatus)[keyof typeof DependencyStatus];

// Error messages
export const DependencyErrorMessages = {
  // Legacy component-coupling messages retained for replay/backward compatibility.
  CONSUMER_ID_REQUIRED: "Consumer ID must be provided",
  CONSUMER_ID_TOO_LONG: "Consumer ID must be less than {max} characters",
  PROVIDER_ID_REQUIRED: "Provider ID must be provided",
  PROVIDER_ID_TOO_LONG: "Provider ID must be less than {max} characters",
  NAME_REQUIRED: "Dependency name must be provided",
  NAME_TOO_LONG: "Dependency name must be less than {max} characters",
  ECOSYSTEM_REQUIRED: "Dependency ecosystem must be provided",
  ECOSYSTEM_TOO_LONG: "Dependency ecosystem must be less than {max} characters",
  PACKAGE_NAME_REQUIRED: "Dependency package name must be provided",
  PACKAGE_NAME_TOO_LONG:
    "Dependency package name must be less than {max} characters",
  VERSION_CONSTRAINT_TOO_LONG:
    "Version constraint must be less than {max} characters",
  ENDPOINT_TOO_LONG: "Endpoint must be less than {max} characters",
  CONTRACT_TOO_LONG: "Contract must be less than {max} characters",
  ALREADY_REMOVED: "Dependency is already removed",
  NOT_FOUND: "Dependency with id {id} not found",
  INVALID_STATUS: "Status must be one of: active, deprecated, removed",
} as const;

// Numeric limits
export const DependencyLimits = {
  // Legacy limits retained for backward compatibility.
  CONSUMER_ID_MAX_LENGTH: 200,
  PROVIDER_ID_MAX_LENGTH: 200,
  NAME_MAX_LENGTH: 200,
  ECOSYSTEM_MAX_LENGTH: 100,
  PACKAGE_NAME_MAX_LENGTH: 300,
  VERSION_CONSTRAINT_MAX_LENGTH: 100,
  ENDPOINT_MAX_LENGTH: 500,
  CONTRACT_MAX_LENGTH: 500,
} as const;

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
