// Entity types (aligned with all aggregates in the system)
export const EntityType = {
  SESSION: "session",
  GOAL: "goal",
  DECISION: "decision",
  ARCHITECTURE: "architecture",
  COMPONENT: "component",
  DEPENDENCY: "dependency",
  GUIDELINE: "guideline",
  PROJECT: "project",
  AUDIENCE: "audience",
  INVARIANT: "invariant",
  PAIN: "pain",
  VALUE: "value",
  RELATION: "relation",
} as const;

export type EntityTypeValue = (typeof EntityType)[keyof typeof EntityType];

// Relation strength
export const RelationStrength = {
  STRONG: "strong",
  MEDIUM: "medium",
  WEAK: "weak",
} as const;

export type RelationStrengthValue =
  (typeof RelationStrength)[keyof typeof RelationStrength];

// Relation status values
export const RelationStatus = {
  ACTIVE: "active",
  DEACTIVATED: "deactivated",
  REMOVED: "removed",
} as const;

export type RelationStatusValue =
  (typeof RelationStatus)[keyof typeof RelationStatus];

// Read-only relation graph audit checks
export const RelationAuditCheck = {
  DANGLING: "dangling",
  ISOLATED: "isolated",
  INACTIVE_ONLY: "inactive-only",
  AMBIGUOUS_ID: "ambiguous-id",
  SUMMARY: "summary",
} as const;

export type RelationAuditCheckValue =
  (typeof RelationAuditCheck)[keyof typeof RelationAuditCheck];

// Relation event types
export const RelationEventType = {
  ADDED: "RelationAddedEvent",
  REMOVED: "RelationRemovedEvent",
  DEACTIVATED: "RelationDeactivatedEvent",
  REACTIVATED: "RelationReactivatedEvent",
} as const;

export type RelationEventTypeValue =
  (typeof RelationEventType)[keyof typeof RelationEventType];

// Error messages
export const RelationErrorMessages = {
  FROM_ENTITY_TYPE_REQUIRED: "Source entity type must be provided",
  FROM_ENTITY_TYPE_INVALID: "Source entity type must be one of: {types}",
  FROM_ENTITY_ID_REQUIRED: "Source entity ID must be provided",
  FROM_ENTITY_ID_INVALID: "Source entity ID must be a non-empty string",
  TO_ENTITY_TYPE_REQUIRED: "Target entity type must be provided",
  TO_ENTITY_TYPE_INVALID: "Target entity type must be one of: {types}",
  TO_ENTITY_ID_REQUIRED: "Target entity ID must be provided",
  TO_ENTITY_ID_INVALID: "Target entity ID must be a non-empty string",
  RELATION_TYPE_REQUIRED: "Relation type must be provided",
  RELATION_TYPE_INVALID: "Relation type must be a non-empty string",
  STRENGTH_INVALID: "Strength must be one of: {strengths}, or null",
  DESCRIPTION_REQUIRED: "Description must be provided",
  DESCRIPTION_TOO_LONG: "Description must be less than {max} characters",
  SELF_REFERENCE: "Cannot create relation from entity to itself",
  RELATION_ID_REQUIRED: "Relation ID must be provided",
  RELATION_NOT_FOUND: "Relation {relationId} does not exist",
  RELATION_ALREADY_REMOVED: "Relation {relationId} has already been removed",
  RELATION_NOT_ACTIVE: "Relation {relationId} is not active",
  RELATION_NOT_DEACTIVATED: "Relation {relationId} is not deactivated",
} as const;

// Numeric limits
export const RelationLimits = {
  DESCRIPTION_MAX_LENGTH: 500,
  RELATION_TYPE_MAX_LENGTH: 50,
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
