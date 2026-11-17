import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import { GoalState } from "../Goal.js";
import {
  GoalStatus,
  GoalErrorMessages,
  formatErrorMessage,
  WAITING_STATES,
} from "../Constants.js";

/**
 * Validates that a goal can be refined (transition to 'refined' status).
 * A goal can only be refined if it's in 'defined' status.
 * Cannot refine a goal that is already refined or in any other status.
 */
export class CanRefineRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Already refined - return specific error
    if (state.status === GoalStatus.REFINED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.ALREADY_REFINED],
      };
    }

    // Already in refinement - allow for idempotent re-entry (claim validation happens at application layer)
    if (state.status === GoalStatus.IN_REFINEMENT) {
      return { isValid: true, errors: [] };
    }

    // Can only refine from TODO status
    if (state.status !== GoalStatus.TODO) {
      return {
        isValid: false,
        errors: [
          formatErrorMessage(GoalErrorMessages.CANNOT_REFINE_IN_STATUS, {
            status: state.status,
          }),
        ],
      };
    }

    return { isValid: true, errors: [] };
  }
}

/**
 * Validates that a goal can be added (defined for the first time).
 * A goal can only be added if its version is 0 (never been defined before).
 */
export class CanAddRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    const isValid = state.version === 0;
    return {
      isValid,
      errors: isValid ? [] : [GoalErrorMessages.ALREADY_DEFINED],
    };
  }
}

/**
 * Validates that a goal can be started (transition to 'doing' status).
 * A goal can be started if it's in 'refined' or 'doing' (idempotent) status.
 * Cannot start a goal that is blocked, done, or not yet refined.
 */
export class CanStartRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    if (state.status === GoalStatus.BLOCKED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_START_BLOCKED],
      };
    }

    if (state.status === GoalStatus.DONE) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_START_COMPLETED],
      };
    }

    // Goal must be refined before starting (or already doing for idempotency)
    if (
      state.status === GoalStatus.TODO ||
      state.status === GoalStatus.IN_REFINEMENT
    ) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_START_NOT_REFINED],
      };
    }

    // Valid statuses: REFINED (first start), DOING (idempotent), REJECTED (rework),
    // UNBLOCKED (after unblocking), INREVIEW, QUALIFIED, PAUSED
    return { isValid: true, errors: [] };
  }
}

/**
 * Validates that a goal can be completed.
 * A goal can only be completed if it is in 'approved' status.
 * Cannot complete a goal that hasn't been approved or is already done.
 */
export class CanCompleteRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    if (state.status === GoalStatus.COMPLETED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.ALREADY_COMPLETED],
      };
    }

    if (state.status !== GoalStatus.QUALIFIED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.NOT_QUALIFIED],
      };
    }

    return { isValid: true, errors: [] };
  }
}

/**
 * Validates that a goal can be reset to its last waiting state.
 * A goal can be reset from in-progress states (IN_REFINEMENT, DOING, IN_REVIEW, CODIFYING)
 * and terminal states (DONE).
 * Cannot reset a blocked goal (to preserve blocker context).
 * Cannot reset a goal already in a waiting state.
 */
export class CanResetRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Blocked goals require explicit unblock to preserve blocker context
    if (state.status === GoalStatus.BLOCKED) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_RESET_BLOCKED],
      };
    }

    // Goals already in a waiting state cannot be reset
    if (WAITING_STATES.has(state.status)) {
      return {
        isValid: false,
        errors: [
          formatErrorMessage(GoalErrorMessages.CANNOT_RESET_WAITING_STATE, {
            status: state.status,
          }),
        ],
      };
    }

    // In-progress and terminal states are valid for reset
    return { isValid: true, errors: [] };
  }
}

/**
 * Validates that a goal can be updated.
 * A goal cannot be updated if it's done.
 */
export class CanUpdateRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    if (state.status === GoalStatus.DONE) {
      return {
        isValid: false,
        errors: [GoalErrorMessages.CANNOT_UPDATE_COMPLETED],
      };
    }

    return { isValid: true, errors: [] };
  }
}

/**
 * Validates that a goal can be blocked from its current status.
 * A goal can be blocked if it's in 'defined', 'doing', 'in-review', or 'codifying' status.
 * Cannot block a goal that is already blocked or done.
 */
export class CanBlockRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Valid statuses to block from: DEFINED, DOING, INREVIEW, CODIFYING
    // Invalid statuses: BLOCKED (already blocked), DONE (can't block terminal)
    const validStatuses: string[] = [
      GoalStatus.TODO,
      GoalStatus.DOING,
      GoalStatus.INREVIEW,
      GoalStatus.CODIFYING,
    ];
    const isValid = validStatuses.includes(state.status);

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.CANNOT_BLOCK_IN_STATUS, {
              status: state.status,
            }),
          ],
    };
  }
}

/**
 * Validates that a goal can be unblocked from its current status.
 * A goal can only be unblocked if it's in 'blocked' status.
 * Cannot unblock a goal that is not blocked.
 */
export class CanUnblockRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Can only unblock from BLOCKED status
    const isValid = state.status === GoalStatus.BLOCKED;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.CANNOT_UNBLOCK_IN_STATUS, {
              status: state.status,
            }),
          ],
    };
  }
}

/**
 * Validates that a goal can be paused from its current status.
 * A goal can only be paused if it's in 'doing' status.
 * Cannot pause a goal that is not actively being worked on.
 */
export class CanPauseRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Can only pause from DOING status
    const isValid = state.status === GoalStatus.DOING;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.CANNOT_PAUSE_IN_STATUS, {
              status: state.status,
            }),
          ],
    };
  }
}

/**
 * Validates that a goal can be resumed from its current status.
 * A goal can only be resumed if it's in 'paused' status.
 * Cannot resume a goal that is not paused.
 */
export class CanResumeRule implements ValidationRule<GoalState> {
  validate(state: GoalState): ValidationResult {
    // Can only resume from PAUSED status
    const isValid = state.status === GoalStatus.PAUSED;

    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.CANNOT_RESUME_IN_STATUS, {
              status: state.status,
            }),
          ],
    };
  }
}
