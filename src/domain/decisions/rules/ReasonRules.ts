import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DecisionErrorMessages,
  DecisionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ReasonRequiredRule implements ValidationRule<string> {
  validate(reason: string): ValidationResult {
    const isValid = !!(reason && reason.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [DecisionErrorMessages.REASON_REQUIRED],
    };
  }
}

export class ReasonMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = DecisionLimits.REASON_MAX_LENGTH) {}

  validate(reason: string): ValidationResult {
    const isValid = reason.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DecisionErrorMessages.REASON_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const REASON_RULES = [
  new ReasonRequiredRule(),
  new ReasonMaxLengthRule(),
];
