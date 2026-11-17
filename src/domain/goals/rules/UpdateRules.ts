import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GoalErrorMessages,
  GoalLimits,
  formatErrorMessage,
} from "../Constants.js";

interface UpdateFields {
  title?: string;
  objective?: string;
  successCriteria?: string[];
  scopeIn?: string[];
  scopeOut?: string[];
}

/**
 * Ensures at least one field is provided for update
 */
export class UpdateFieldsProvidedRule implements ValidationRule<UpdateFields> {
  validate(fields: UpdateFields): ValidationResult {
    const hasChanges =
      fields.title !== undefined ||
      fields.objective !== undefined ||
      fields.successCriteria !== undefined ||
      fields.scopeIn !== undefined ||
      fields.scopeOut !== undefined;

    return {
      isValid: hasChanges,
      errors: hasChanges ? [] : [GoalErrorMessages.NO_CHANGES_PROVIDED],
    };
  }
}

/**
 * Validates title if provided (optional but must be valid if present)
 */
export class OptionalTitleValidRule implements ValidationRule<UpdateFields> {
  validate(fields: UpdateFields): ValidationResult {
    if (fields.title === undefined) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    if (!fields.title || fields.title.trim() === "") {
      errors.push(GoalErrorMessages.TITLE_REQUIRED);
    }
    if (fields.title.length > GoalLimits.TITLE_MAX_LENGTH) {
      errors.push(
        formatErrorMessage(GoalErrorMessages.TITLE_TOO_LONG, {
          max: GoalLimits.TITLE_MAX_LENGTH,
        }),
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Validates objective if provided (optional but must be valid if present)
 */
export class OptionalObjectiveValidRule implements ValidationRule<UpdateFields> {
  validate(fields: UpdateFields): ValidationResult {
    if (fields.objective === undefined) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    if (!fields.objective || fields.objective.trim() === "") {
      errors.push(GoalErrorMessages.OBJECTIVE_REQUIRED);
    }
    if (fields.objective.length > GoalLimits.OBJECTIVE_MAX_LENGTH) {
      errors.push(
        formatErrorMessage(GoalErrorMessages.OBJECTIVE_TOO_LONG, {
          max: GoalLimits.OBJECTIVE_MAX_LENGTH,
        }),
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Validates success criteria if provided (optional but must be valid if present)
 */
export class OptionalSuccessCriteriaValidRule implements ValidationRule<UpdateFields> {
  validate(fields: UpdateFields): ValidationResult {
    if (fields.successCriteria === undefined) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    if (!fields.successCriteria || fields.successCriteria.length === 0) {
      errors.push(GoalErrorMessages.SUCCESS_CRITERIA_REQUIRED);
    }
    if (fields.successCriteria.length > GoalLimits.MAX_SUCCESS_CRITERIA) {
      errors.push(
        formatErrorMessage(GoalErrorMessages.TOO_MANY_CRITERIA, {
          max: GoalLimits.MAX_SUCCESS_CRITERIA,
        }),
      );
    }
    const tooLong = fields.successCriteria.find(
      (c) => c.length > GoalLimits.SUCCESS_CRITERION_MAX_LENGTH,
    );
    if (tooLong) {
      errors.push(
        formatErrorMessage(GoalErrorMessages.SUCCESS_CRITERION_TOO_LONG, {
          max: GoalLimits.SUCCESS_CRITERION_MAX_LENGTH,
        }),
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Validates scope fields if provided (optional but must be valid if present)
 */
export class OptionalScopeValidRule implements ValidationRule<UpdateFields> {
  validate(fields: UpdateFields): ValidationResult {
    const errors: string[] = [];

    // Validate scopeIn if provided
    if (fields.scopeIn !== undefined) {
      if (fields.scopeIn.length > GoalLimits.MAX_SCOPE_ITEMS) {
        errors.push(
          formatErrorMessage(GoalErrorMessages.TOO_MANY_SCOPE_ITEMS, {
            max: GoalLimits.MAX_SCOPE_ITEMS,
          }),
        );
      }
      const tooLongIn = fields.scopeIn.find(
        (item) => item.length > GoalLimits.SCOPE_ITEM_MAX_LENGTH,
      );
      if (tooLongIn) {
        errors.push(
          formatErrorMessage(GoalErrorMessages.SCOPE_ITEM_TOO_LONG, {
            max: GoalLimits.SCOPE_ITEM_MAX_LENGTH,
          }),
        );
      }
    }

    // Validate scopeOut if provided
    if (fields.scopeOut !== undefined) {
      if (fields.scopeOut.length > GoalLimits.MAX_SCOPE_ITEMS) {
        errors.push(
          formatErrorMessage(GoalErrorMessages.TOO_MANY_SCOPE_ITEMS, {
            max: GoalLimits.MAX_SCOPE_ITEMS,
          }),
        );
      }
      const tooLongOut = fields.scopeOut.find(
        (item) => item.length > GoalLimits.SCOPE_ITEM_MAX_LENGTH,
      );
      if (tooLongOut) {
        errors.push(
          formatErrorMessage(GoalErrorMessages.SCOPE_ITEM_TOO_LONG, {
            max: GoalLimits.SCOPE_ITEM_MAX_LENGTH,
          }),
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const UPDATE_RULES = [
  new UpdateFieldsProvidedRule(),
  new OptionalTitleValidRule(),
  new OptionalObjectiveValidRule(),
  new OptionalSuccessCriteriaValidRule(),
  new OptionalScopeValidRule(),
];
