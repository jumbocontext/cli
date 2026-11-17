import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ProviderIdRequiredRule implements ValidationRule<string> {
  validate(providerId: string): ValidationResult {
    const isValid = !!(providerId && providerId.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [DependencyErrorMessages.PROVIDER_ID_REQUIRED],
    };
  }
}

export class ProviderIdMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = DependencyLimits.PROVIDER_ID_MAX_LENGTH,
  ) {}

  validate(providerId: string): ValidationResult {
    const isValid = providerId.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DependencyErrorMessages.PROVIDER_ID_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const PROVIDER_ID_RULES = [
  new ProviderIdRequiredRule(),
  new ProviderIdMaxLengthRule(),
];
