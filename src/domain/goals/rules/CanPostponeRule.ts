import { ValidationRule, ValidationResult } from "../../validation/ValidationRule.js";
import { GoalState } from "../Goal.js";
import { GoalErrorMessages, GoalStatus, formatErrorMessage } from "../Constants.js";

/** Allows postponement only while a goal is still defined. */
export class CanPostponeRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    const isValid = state.status === GoalStatus.TODO;

    return {
      isValid,
      errors: isValid
        ? []
        : [formatErrorMessage(
            GoalErrorMessages.CANNOT_POSTPONE_IN_STATUS,
            { status: state.status }
          )],
    };
  }
}
