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
 * Validates that a goal can be committed.
 * A goal can only be committed if it's in 'in-refinement' status.
 * Cannot commit a goal that is in any other status.
 */
export class CanCommitRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    const isValid = state.status === GoalStatus.IN_REFINEMENT;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.CANNOT_COMMIT_IN_STATUS, {
              status: state.status,
            }),
          ],
    };
  }
}
