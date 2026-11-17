import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GoalErrorMessages,
  GoalLimits,
  formatErrorMessage,
} from "../Constants.js";

export class SuccessCriteriaRequiredRule implements ValidationRule<string[]> {
  validate(criteria: string[]): ValidationResult {
    const isValid = criteria && criteria.length > 0;
    return {
      isValid,
      errors: isValid ? [] : [GoalErrorMessages.SUCCESS_CRITERIA_REQUIRED],
    };
  }
}

export class SuccessCriteriaMaxCountRule implements ValidationRule<string[]> {
  constructor(private maxCount: number = GoalLimits.MAX_SUCCESS_CRITERIA) {}

  validate(criteria: string[]): ValidationResult {
    const isValid = criteria.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.TOO_MANY_CRITERIA, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export class SuccessCriterionMaxLengthRule implements ValidationRule<string[]> {
  constructor(
    private maxLength: number = GoalLimits.SUCCESS_CRITERION_MAX_LENGTH,
  ) {}

  validate(criteria: string[]): ValidationResult {
    const tooLong = criteria.find((c) => c.length > this.maxLength);
    const isValid = !tooLong;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.SUCCESS_CRITERION_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const SUCCESS_CRITERIA_RULES = [
  new SuccessCriteriaRequiredRule(),
  new SuccessCriteriaMaxCountRule(),
  new SuccessCriterionMaxLengthRule(),
];
