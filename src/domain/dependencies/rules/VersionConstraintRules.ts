import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyLimits,
  formatErrorMessage,
} from "../Constants.js";

export class VersionConstraintMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = DependencyLimits.VERSION_CONSTRAINT_MAX_LENGTH,
  ) {}

  validate(versionConstraint: string): ValidationResult {
    const isValid = versionConstraint.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(
              DependencyErrorMessages.VERSION_CONSTRAINT_TOO_LONG,
              { max: this.maxLength },
            ),
          ],
    };
  }
}

export const VERSION_CONSTRAINT_RULES = [new VersionConstraintMaxLengthRule()];
