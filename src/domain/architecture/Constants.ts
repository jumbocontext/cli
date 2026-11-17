/**
 * Domain constants for Architecture aggregate.
 * Centralizes event types, error messages, and limits.
 */

// Architecture event types
export const ArchitectureEventType = {
  DEFINED: "ArchitectureDefinedEvent",
  UPDATED: "ArchitectureUpdatedEvent",
  DEPRECATED: "ArchitectureDeprecatedEvent",
} as const;

export type ArchitectureEventTypeValue =
  (typeof ArchitectureEventType)[keyof typeof ArchitectureEventType];

// Error messages
export const ArchitectureErrorMessages = {
  ALREADY_DEFINED: "Architecture is already defined",
  NOT_DEFINED:
    "Architecture must be defined before updating. Use architecture define first.",
  DEPRECATED:
    "Architecture entity is deprecated. Register individual entities instead.",
  ALREADY_DEPRECATED: "Architecture is already deprecated",
  DESCRIPTION_REQUIRED: "Architecture description must be provided",
  DESCRIPTION_TOO_LONG:
    "Architecture description must be less than {max} characters",
  ORGANIZATION_REQUIRED: "Architecture organization must be provided",
  ORGANIZATION_TOO_LONG:
    "Architecture organization must be less than {max} characters",
  PATTERN_TOO_LONG: "Pattern must be less than {max} characters",
  PRINCIPLE_TOO_LONG: "Principle must be less than {max} characters",
  STACK_ITEM_TOO_LONG: "Stack item must be less than {max} characters",
  DATA_STORE_NAME_REQUIRED: "Data store name must be provided",
  DATA_STORE_TYPE_REQUIRED: "Data store type must be provided",
  DATA_STORE_PURPOSE_REQUIRED: "Data store purpose must be provided",
  DATA_STORE_NAME_TOO_LONG:
    "Data store name must be less than {max} characters",
  DATA_STORE_TYPE_TOO_LONG:
    "Data store type must be less than {max} characters",
  DATA_STORE_PURPOSE_TOO_LONG:
    "Data store purpose must be less than {max} characters",
  TOO_MANY_PATTERNS: "Cannot have more than {max} patterns",
  TOO_MANY_PRINCIPLES: "Cannot have more than {max} principles",
  TOO_MANY_STACK_ITEMS: "Cannot have more than {max} stack items",
  TOO_MANY_DATA_STORES: "Cannot have more than {max} data stores",
} as const;

// Numeric limits
export const ArchitectureLimits = {
  DESCRIPTION_MAX_LENGTH: 500,
  ORGANIZATION_MAX_LENGTH: 200,
  PATTERN_MAX_LENGTH: 100,
  PRINCIPLE_MAX_LENGTH: 200,
  STACK_ITEM_MAX_LENGTH: 100,
  DATA_STORE_NAME_MAX_LENGTH: 100,
  DATA_STORE_TYPE_MAX_LENGTH: 50,
  DATA_STORE_PURPOSE_MAX_LENGTH: 200,
  MAX_PATTERNS: 20,
  MAX_PRINCIPLES: 20,
  MAX_STACK_ITEMS: 50,
  MAX_DATA_STORES: 20,
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
