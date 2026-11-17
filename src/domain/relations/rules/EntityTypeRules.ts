import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  EntityType,
  RelationErrorMessages,
  formatErrorMessage,
} from "../Constants.js";

export class EntityTypeRequiredRule implements ValidationRule<string> {
  constructor(private readonly prefix: "from" | "to") {}

  validate(entityType: string): ValidationResult {
    const isValid = !!(entityType && entityType.trim() !== "");
    const message =
      this.prefix === "from"
        ? RelationErrorMessages.FROM_ENTITY_TYPE_REQUIRED
        : RelationErrorMessages.TO_ENTITY_TYPE_REQUIRED;

    return {
      isValid,
      errors: isValid ? [] : [message],
    };
  }
}

export class EntityTypeValidRule implements ValidationRule<string> {
  constructor(private readonly prefix: "from" | "to") {}

  validate(entityType: string): ValidationResult {
    const validTypes = Object.values(EntityType);
    const isValid = (validTypes as readonly string[]).includes(entityType);
    const message =
      this.prefix === "from"
        ? RelationErrorMessages.FROM_ENTITY_TYPE_INVALID
        : RelationErrorMessages.TO_ENTITY_TYPE_INVALID;

    return {
      isValid,
      errors: isValid
        ? []
        : [formatErrorMessage(message, { types: validTypes.join(", ") })],
    };
  }
}

export class EntityIdRequiredRule implements ValidationRule<string> {
  constructor(private readonly prefix: "from" | "to") {}

  validate(entityId: string): ValidationResult {
    const isValid = !!(entityId && entityId.trim() !== "");
    const message =
      this.prefix === "from"
        ? RelationErrorMessages.FROM_ENTITY_ID_REQUIRED
        : RelationErrorMessages.TO_ENTITY_ID_REQUIRED;

    return {
      isValid,
      errors: isValid ? [] : [message],
    };
  }
}

export function ENTITY_TYPE_RULES(prefix: "from" | "to") {
  return [new EntityTypeRequiredRule(prefix), new EntityTypeValidRule(prefix)];
}

export function ENTITY_ID_RULES(prefix: "from" | "to") {
  return [new EntityIdRequiredRule(prefix)];
}
