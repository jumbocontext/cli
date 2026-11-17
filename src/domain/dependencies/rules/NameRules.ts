import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyLimits,
  formatErrorMessage,
} from "../Constants.js";

export class NameRequiredRule implements ValidationRule<string> {
  validate(name: string): ValidationResult {
    const isValid = !!(name && name.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [DependencyErrorMessages.NAME_REQUIRED],
    };
  }
}

export class NameMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = DependencyLimits.NAME_MAX_LENGTH) {}

  validate(name: string): ValidationResult {
    const isValid = name.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DependencyErrorMessages.NAME_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const NAME_RULES = [new NameRequiredRule(), new NameMaxLengthRule()];
