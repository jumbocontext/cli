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
 * Validates that a goal can be submitted for review (start QA review).
 * A goal can only be submitted for review if it's in 'submitted' status.
 * The implementation must first be submitted via 'goal submit' before review can begin.
 */
export class CanSubmitForReviewRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Allow SUBMITTED (first entry) or IN_REVIEW (idempotent re-entry, claim validation at application layer)
    const isValid =
      state.status === GoalStatus.SUBMITTED ||
      state.status === GoalStatus.INREVIEW;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(
              GoalErrorMessages.CANNOT_SUBMIT_FOR_REVIEW_IN_STATUS,
              { status: state.status },
            ),
          ],
    };
  }
}
