import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DecisionErrorMessages,
  DecisionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ContextRequiredRule implements ValidationRule<string> {
  validate(context: string): ValidationResult {
    const isValid = !!(context && context.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [DecisionErrorMessages.CONTEXT_REQUIRED],
    };
  }
}

export class ContextMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = DecisionLimits.CONTEXT_MAX_LENGTH) {}

  validate(context: string): ValidationResult {
    const isValid = context.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DecisionErrorMessages.CONTEXT_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const CONTEXT_RULES = [
  new ContextRequiredRule(),
  new ContextMaxLengthRule(),
];
