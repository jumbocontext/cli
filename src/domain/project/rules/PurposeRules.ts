/**
 * Validation rules for project purpose field.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ProjectErrorMessages,
  ProjectLimits,
  formatErrorMessage,
} from "../Constants.js";

export class PurposeMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = ProjectLimits.PURPOSE_MAX_LENGTH) {}

  validate(purpose: string): ValidationResult {
    const isValid = purpose.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ProjectErrorMessages.PURPOSE_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const PURPOSE_RULES = [new PurposeMaxLengthRule()];
