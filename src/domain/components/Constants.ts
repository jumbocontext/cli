// Component event types
export const ComponentEventType = {
  ADDED: "ComponentAddedEvent",
  UPDATED: "ComponentUpdatedEvent",
  DEPRECATED: "ComponentDeprecatedEvent",
  REMOVED: "ComponentRemovedEvent",
  RENAMED: "ComponentRenamedEvent",
  UNDEPRECATED: "ComponentUndeprecatedEvent",
} as const;

export type ComponentEventTypeValue =
  (typeof ComponentEventType)[keyof typeof ComponentEventType];

// Component types
export const ComponentType = {
  SERVICE: "service",
  DB: "db",
  QUEUE: "queue",
  UI: "ui",
  LIB: "lib",
  API: "api",
  WORKER: "worker",
  CACHE: "cache",
  STORAGE: "storage",
} as const;

export type ComponentTypeValue =
  (typeof ComponentType)[keyof typeof ComponentType];

// Component status
export const ComponentStatus = {
  ACTIVE: "active",
  DEPRECATED: "deprecated",
  REMOVED: "removed",
} as const;

export type ComponentStatusValue =
  (typeof ComponentStatus)[keyof typeof ComponentStatus];

// Error messages
export const ComponentErrorMessages = {
  NAME_REQUIRED: "Component name must be provided",
  NAME_TOO_LONG: "Component name must be less than {max} characters",
  TYPE_REQUIRED: "Component type must be provided",
  TYPE_INVALID: "Component type must be one of: {types}",
  DESCRIPTION_REQUIRED: "Component description must be provided",
  DESCRIPTION_TOO_LONG:
    "Component description must be less than {max} characters",
  RESPONSIBILITY_REQUIRED: "Component responsibility must be provided",
  RESPONSIBILITY_TOO_LONG:
    "Component responsibility must be less than {max} characters",
  PATH_REQUIRED: "Component path must be provided",
  PATH_TOO_LONG: "Component path must be less than {max} characters",
  DEPRECATION_REASON_TOO_LONG:
    "Deprecation reason must be less than {max} characters",
  UNDEPRECATION_REASON_REQUIRED: "Undeprecation reason must be provided",
  UNDEPRECATION_REASON_TOO_LONG:
    "Undeprecation reason must be less than {max} characters",
  ALREADY_DEPRECATED: "Component is already deprecated",
  ALREADY_REMOVED: "Component has been removed",
  ALREADY_ACTIVE: "Component is already active",
  CANNOT_UNDEPRECATE_REMOVED: "Removed components cannot be undeprecated",
  NOT_DEPRECATED: "Component must be deprecated before removal",
  NO_FIELDS_TO_UPDATE: "At least one field must be provided to update",
  COMPONENT_NOT_FOUND: "Component with ID {id} not found",
  SAME_NAME: "New name must be different from the current name",
} as const;

// Numeric limits
export const ComponentLimits = {
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  RESPONSIBILITY_MAX_LENGTH: 300,
  PATH_MAX_LENGTH: 500,
  DEPRECATION_REASON_MAX_LENGTH: 500,
} as const;

// Validation arrays derived from constants (no magic strings)
export const VALID_COMPONENT_TYPES: readonly string[] =
  Object.values(ComponentType);
export const VALID_COMPONENT_STATUSES: readonly string[] =
  Object.values(ComponentStatus);

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
