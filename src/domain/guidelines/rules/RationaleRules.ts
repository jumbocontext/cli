/**
 * Validation rules for guideline rationale field.
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

export class RationaleRequiredRule implements ValidationRule<string> {
  validate(rationale: string): ValidationResult {
    const isValid = !!(rationale && rationale.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [GuidelineErrorMessages.RATIONALE_REQUIRED],
    };
  }
}

export class RationaleMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = GuidelineLimits.RATIONALE_MAX_LENGTH,
  ) {}

  validate(rationale: string): ValidationResult {
    const isValid = rationale.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GuidelineErrorMessages.RATIONALE_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const RATIONALE_RULES = [
  new RationaleRequiredRule(),
  new RationaleMaxLengthRule(),
];
