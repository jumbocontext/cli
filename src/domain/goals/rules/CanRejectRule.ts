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
 * Validates that a goal can be rejected.
 * A goal can only be rejected if it's in 'in-review' status.
 * Rejection returns the goal to the implement phase for rework.
 */
export class CanRejectRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    const isValid = state.status === GoalStatus.INREVIEW;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.CANNOT_REJECT_IN_STATUS, {
              status: state.status,
            }),
          ],
    };
  }
}
