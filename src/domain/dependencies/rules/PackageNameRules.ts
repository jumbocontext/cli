import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyLimits,
  formatErrorMessage,
} from "../Constants.js";

export class PackageNameRequiredRule implements ValidationRule<string> {
  validate(packageName: string): ValidationResult {
    const isValid = !!(packageName && packageName.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [DependencyErrorMessages.PACKAGE_NAME_REQUIRED],
    };
  }
}

export class PackageNameMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = DependencyLimits.PACKAGE_NAME_MAX_LENGTH,
  ) {}

  validate(packageName: string): ValidationResult {
    const isValid = packageName.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DependencyErrorMessages.PACKAGE_NAME_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const PACKAGE_NAME_RULES = [
  new PackageNameRequiredRule(),
  new PackageNameMaxLengthRule(),
];
