import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ComponentErrorMessages,
  ComponentLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ResponsibilityRequiredRule implements ValidationRule<string> {
  validate(responsibility: string): ValidationResult {
    const isValid = !!(responsibility && responsibility.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [ComponentErrorMessages.RESPONSIBILITY_REQUIRED],
    };
  }
}

export class ResponsibilityMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = ComponentLimits.RESPONSIBILITY_MAX_LENGTH,
  ) {}

  validate(responsibility: string): ValidationResult {
    const isValid = responsibility.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ComponentErrorMessages.RESPONSIBILITY_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const RESPONSIBILITY_RULES = [
  new ResponsibilityRequiredRule(),
  new ResponsibilityMaxLengthRule(),
];
