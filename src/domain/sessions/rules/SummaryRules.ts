import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  SessionErrorMessages,
  SessionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class SummaryMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = SessionLimits.SUMMARY_MAX_LENGTH) {}

  validate(summary: string): ValidationResult {
    const isValid = summary.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(SessionErrorMessages.SUMMARY_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const SUMMARY_RULES = [new SummaryMaxLengthRule()];
