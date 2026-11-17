/**
 * Validation rules for guideline examples field (array of paths).
 * Pure domain validation only - no I/O operations.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GuidelineErrorMessages,
  GuidelineLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ExamplesMaxCountRule implements ValidationRule<string[]> {
  constructor(private maxCount: number = GuidelineLimits.MAX_EXAMPLES) {}

  validate(examples: string[]): ValidationResult {
    const isValid = examples.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GuidelineErrorMessages.TOO_MANY_EXAMPLES, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export class ExamplePathMaxLengthRule implements ValidationRule<string[]> {
  constructor(
    private maxLength: number = GuidelineLimits.EXAMPLE_PATH_MAX_LENGTH,
  ) {}

  validate(examples: string[]): ValidationResult {
    const errors: string[] = [];

    for (const path of examples) {
      if (path.length > this.maxLength) {
        errors.push(
          formatErrorMessage(GuidelineErrorMessages.EXAMPLE_PATH_TOO_LONG, {
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

export const EXAMPLES_RULES = [
  new ExamplesMaxCountRule(),
  new ExamplePathMaxLengthRule(),
];
