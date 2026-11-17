import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyStatus,
  DependencyStatusType,
} from "../Constants.js";

export class StatusValueRule implements ValidationRule<DependencyStatusType> {
  validate(status: DependencyStatusType): ValidationResult {
    const validStatuses = Object.values(DependencyStatus);
    const isValid = validStatuses.includes(status);
    return {
      isValid,
      errors: isValid ? [] : [DependencyErrorMessages.INVALID_STATUS],
    };
  }
}

export const STATUS_RULES = [new StatusValueRule()];
