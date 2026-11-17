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
 * Validates that a goal can be approved.
 * A goal can only be approved if it's in 'in-review' status.
 * Cannot approve a goal that is in any other status.
 */
export class CanQualifyRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Valid status to approve from: IN-REVIEW only
    const isValid = state.status === GoalStatus.INREVIEW;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.CANNOT_QUALIFY_IN_STATUS, {
              status: state.status,
            }),
          ],
    };
  }
}
