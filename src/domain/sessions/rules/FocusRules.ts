import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  SessionErrorMessages,
  SessionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class FocusRequiredRule implements ValidationRule<string> {
  validate(focus: string): ValidationResult {
    const isValid = !!(focus && focus.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [SessionErrorMessages.FOCUS_REQUIRED],
    };
  }
}

export class FocusMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = SessionLimits.FOCUS_MAX_LENGTH) {}

  validate(focus: string): ValidationResult {
    const isValid = focus.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(SessionErrorMessages.FOCUS_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const FOCUS_RULES = [new FocusRequiredRule(), new FocusMaxLengthRule()];
