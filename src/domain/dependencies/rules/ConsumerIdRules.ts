import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ConsumerIdRequiredRule implements ValidationRule<string> {
  validate(consumerId: string): ValidationResult {
    const isValid = !!(consumerId && consumerId.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [DependencyErrorMessages.CONSUMER_ID_REQUIRED],
    };
  }
}

export class ConsumerIdMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = DependencyLimits.CONSUMER_ID_MAX_LENGTH,
  ) {}

  validate(consumerId: string): ValidationResult {
    const isValid = consumerId.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DependencyErrorMessages.CONSUMER_ID_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const CONSUMER_ID_RULES = [
  new ConsumerIdRequiredRule(),
  new ConsumerIdMaxLengthRule(),
];
