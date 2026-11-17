import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GoalErrorMessages,
  GoalLimits,
  formatErrorMessage,
} from "../Constants.js";

export class TitleRequiredRule implements ValidationRule<string> {
  validate(title: string): ValidationResult {
    const isValid = !!(title && title.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [GoalErrorMessages.TITLE_REQUIRED],
    };
  }
}

export class TitleMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = GoalLimits.TITLE_MAX_LENGTH) {}

  validate(title: string): ValidationResult {
    const isValid = title.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.TITLE_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const TITLE_RULES = [new TitleRequiredRule(), new TitleMaxLengthRule()];
