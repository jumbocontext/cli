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
 * Validates that a goal can be submitted for review.
 * A goal can only be submitted if it's in 'doing' status.
 * This transitions the goal from the implementation phase to the submitted waiting state.
 */
export class CanSubmitRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    const isValid = state.status === GoalStatus.DOING;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.CANNOT_SUBMIT_IN_STATUS, {
              status: state.status,
            }),
          ],
    };
  }
}
