import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GoalErrorMessages,
  GoalLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ScopeMaxCountRule implements ValidationRule<string[]> {
  constructor(private maxCount: number = GoalLimits.MAX_SCOPE_ITEMS) {}

  validate(scopeItems: string[]): ValidationResult {
    const isValid = scopeItems.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.TOO_MANY_SCOPE_ITEMS, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export class ScopeItemMaxLengthRule implements ValidationRule<string[]> {
  constructor(private maxLength: number = GoalLimits.SCOPE_ITEM_MAX_LENGTH) {}

  validate(scopeItems: string[]): ValidationResult {
    const tooLong = scopeItems.find((item) => item.length > this.maxLength);
    const isValid = !tooLong;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.SCOPE_ITEM_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const SCOPE_RULES = [
  new ScopeMaxCountRule(),
  new ScopeItemMaxLengthRule(),
];
