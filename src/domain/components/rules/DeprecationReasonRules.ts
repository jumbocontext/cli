import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ComponentErrorMessages,
  ComponentLimits,
  formatErrorMessage,
} from "../Constants.js";

export class DeprecationReasonMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = ComponentLimits.DEPRECATION_REASON_MAX_LENGTH,
  ) {}

  validate(reason: string): ValidationResult {
    const isValid = reason.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(
              ComponentErrorMessages.DEPRECATION_REASON_TOO_LONG,
              { max: this.maxLength },
            ),
          ],
    };
  }
}

export const DEPRECATION_REASON_RULES = [new DeprecationReasonMaxLengthRule()];
