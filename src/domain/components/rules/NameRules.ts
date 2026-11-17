import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ComponentErrorMessages,
  ComponentLimits,
  formatErrorMessage,
} from "../Constants.js";

export class NameRequiredRule implements ValidationRule<string> {
  validate(name: string): ValidationResult {
    const isValid = !!(name && name.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [ComponentErrorMessages.NAME_REQUIRED],
    };
  }
}

export class NameMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = ComponentLimits.NAME_MAX_LENGTH) {}

  validate(name: string): ValidationResult {
    const isValid = name.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ComponentErrorMessages.NAME_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const NAME_RULES = [new NameRequiredRule(), new NameMaxLengthRule()];
