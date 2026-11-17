import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import { GoalState } from "../Goal.js";
import {
  GoalStatus,
  GoalErrorMessages,
  formatErrorMessage,
} from "../Constants.js";

/**
 * Validates that a goal can be closed.
 * A goal can only be closed if it's in 'codifying' status.
 * Cannot close a goal that is already done.
 */
export class CanCloseRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    if (state.status === GoalStatus.DONE) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.ALREADY_DONE],
      };
    }

    if (state.status !== GoalStatus.CODIFYING) {
      return {
        isValid: false,
        errors: [
          formatErrorMessage(GoalErrorMessages.CANNOT_CLOSE_IN_STATUS, {
            status: state.status,
          }),
        ],
      };
    }

    return { isValid: true, errors: [] };
  }
}
