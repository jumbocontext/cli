/**
 * Validation rules for invariant rationale field.
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

export class RationaleMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = InvariantLimits.RATIONALE_MAX_LENGTH,
  ) {}

  validate(rationale: string): ValidationResult {
    const isValid = rationale.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(InvariantErrorMessages.RATIONALE_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const RATIONALE_RULES = [new RationaleMaxLengthRule()];
