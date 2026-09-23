import { ValidationRule, ValidationResult } from "../../validation/ValidationRule.js";
import { GoalState } from "../Goal.js";
import { GoalErrorMessages, GoalStatus, formatErrorMessage } from "../Constants.js";

/** Allows reinstatement only while a goal is postponed. */
export class CanReinstateRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    const isValid = state.status === GoalStatus.POSTPONED;

    return {
      isValid,
      errors: isValid
        ? []
        : [formatErrorMessage(
            GoalErrorMessages.CANNOT_REINSTATE_IN_STATUS,
            { status: state.status }
          )],
    };
  }
}
