import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DecisionErrorMessages,
  DecisionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class AlternativesMaxCountRule implements ValidationRule<string[]> {
  constructor(private maxCount: number = DecisionLimits.MAX_ALTERNATIVES) {}

  validate(alternatives: string[]): ValidationResult {
    const isValid = alternatives.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DecisionErrorMessages.TOO_MANY_ALTERNATIVES, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export class AlternativeMaxLengthRule implements ValidationRule<string[]> {
  constructor(
    private maxLength: number = DecisionLimits.ALTERNATIVE_MAX_LENGTH,
  ) {}

  validate(alternatives: string[]): ValidationResult {
    const errors: string[] = [];

    for (const alternative of alternatives) {
      if (alternative.length > this.maxLength) {
        errors.push(
          formatErrorMessage(DecisionErrorMessages.ALTERNATIVE_TOO_LONG, {
            max: this.maxLength,
          }),
        );
        break; // Only report once
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const ALTERNATIVES_RULES = [
  new AlternativesMaxCountRule(),
  new AlternativeMaxLengthRule(),
];
