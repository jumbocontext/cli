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
 * Validates that a goal can be codified.
 * A goal can only be codified if it's in 'approved' status.
 * Cannot codify a goal that is already codifying or done.
 */
export class CanCodifyRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Allow CODIFYING for idempotent re-entry (claim validation at application layer)
    if (state.status === GoalStatus.CODIFYING) {
      return { isValid: true, errors: [] };
    }

    if (state.status === GoalStatus.DONE) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.ALREADY_DONE],
      };
    }

    if (state.status !== GoalStatus.QUALIFIED) {
      return {
        isValid: false,
        errors: [
          formatErrorMessage(GoalErrorMessages.CANNOT_CODIFY_IN_STATUS, {
            status: state.status,
          }),
        ],
      };
    }

    return { isValid: true, errors: [] };
  }
}
