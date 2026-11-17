import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ArchitectureErrorMessages,
  ArchitectureLimits,
  formatErrorMessage,
} from "../Constants.js";

export class PatternMaxLengthRule implements ValidationRule<string[]> {
  constructor(
    private maxLength: number = ArchitectureLimits.PATTERN_MAX_LENGTH,
  ) {}

  validate(patterns: string[]): ValidationResult {
    const errors: string[] = [];
    for (const pattern of patterns) {
      if (pattern.length > this.maxLength) {
        errors.push(
          formatErrorMessage(ArchitectureErrorMessages.PATTERN_TOO_LONG, {
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

export class PatternsMaxCountRule implements ValidationRule<string[]> {
  constructor(private maxCount: number = ArchitectureLimits.MAX_PATTERNS) {}

  validate(patterns: string[]): ValidationResult {
    const isValid = patterns.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ArchitectureErrorMessages.TOO_MANY_PATTERNS, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export const PATTERNS_RULES = [
  new PatternMaxLengthRule(),
  new PatternsMaxCountRule(),
];
