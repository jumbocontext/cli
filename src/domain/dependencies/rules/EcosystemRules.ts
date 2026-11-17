import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyLimits,
  formatErrorMessage,
} from "../Constants.js";

export class EcosystemRequiredRule implements ValidationRule<string> {
  validate(ecosystem: string): ValidationResult {
    const isValid = !!(ecosystem && ecosystem.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [DependencyErrorMessages.ECOSYSTEM_REQUIRED],
    };
  }
}

export class EcosystemMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = DependencyLimits.ECOSYSTEM_MAX_LENGTH,
  ) {}

  validate(ecosystem: string): ValidationResult {
    const isValid = ecosystem.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DependencyErrorMessages.ECOSYSTEM_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const ECOSYSTEM_RULES = [
  new EcosystemRequiredRule(),
  new EcosystemMaxLengthRule(),
];
