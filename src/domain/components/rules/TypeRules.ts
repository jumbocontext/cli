import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ComponentType,
  ComponentTypeValue,
  ComponentErrorMessages,
  formatErrorMessage,
} from "../Constants.js";

export class TypeRequiredRule implements ValidationRule<string> {
  validate(type: string): ValidationResult {
    const isValid = !!(type && type.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [ComponentErrorMessages.TYPE_REQUIRED],
    };
  }
}

export class TypeValidRule implements ValidationRule<string> {
  validate(type: string): ValidationResult {
    const validTypes = Object.values(ComponentType);
    const isValid = validTypes.includes(type as ComponentTypeValue);
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ComponentErrorMessages.TYPE_INVALID, {
              types: validTypes.join(", "),
            }),
          ],
    };
  }
}

export const TYPE_RULES = [new TypeRequiredRule(), new TypeValidRule()];
