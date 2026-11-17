import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ComponentErrorMessages,
  ComponentLimits,
  formatErrorMessage,
} from "../Constants.js";

export class PathRequiredRule implements ValidationRule<string> {
  validate(path: string): ValidationResult {
    const isValid = !!(path && path.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [ComponentErrorMessages.PATH_REQUIRED],
    };
  }
}

export class PathMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = ComponentLimits.PATH_MAX_LENGTH) {}

  validate(path: string): ValidationResult {
    const isValid = path.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ComponentErrorMessages.PATH_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const PATH_RULES = [new PathRequiredRule(), new PathMaxLengthRule()];
