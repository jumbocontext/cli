/**
 * Validation rules for invariant title field.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  InvariantErrorMessages,
  InvariantLimits,
  formatErrorMessage,
} from "../Constants.js";

export class TitleRequiredRule implements ValidationRule<string> {
  validate(title: string): ValidationResult {
    const isValid = !!(title && title.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [InvariantErrorMessages.TITLE_REQUIRED],
    };
  }
}

export class TitleMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = InvariantLimits.TITLE_MAX_LENGTH) {}

  validate(title: string): ValidationResult {
    const isValid = title.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(InvariantErrorMessages.TITLE_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const TITLE_RULES = [new TitleRequiredRule(), new TitleMaxLengthRule()];
