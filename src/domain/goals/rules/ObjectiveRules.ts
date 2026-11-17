import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GoalErrorMessages,
  GoalLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ObjectiveRequiredRule implements ValidationRule<string> {
  validate(objective: string): ValidationResult {
    const isValid = !!(objective && objective.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [GoalErrorMessages.OBJECTIVE_REQUIRED],
    };
  }
}

export class ObjectiveMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = GoalLimits.OBJECTIVE_MAX_LENGTH) {}

  validate(objective: string): ValidationResult {
    const isValid = objective.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.OBJECTIVE_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const OBJECTIVE_RULES = [
  new ObjectiveRequiredRule(),
  new ObjectiveMaxLengthRule(),
];
