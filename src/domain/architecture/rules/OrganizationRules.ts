import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ArchitectureErrorMessages,
  ArchitectureLimits,
  formatErrorMessage,
} from "../Constants.js";

export class OrganizationRequiredRule implements ValidationRule<string> {
  validate(organization: string): ValidationResult {
    const isValid = !!(organization && organization.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [ArchitectureErrorMessages.ORGANIZATION_REQUIRED],
    };
  }
}

export class OrganizationMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = ArchitectureLimits.ORGANIZATION_MAX_LENGTH,
  ) {}

  validate(organization: string): ValidationResult {
    const isValid = organization.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(
              ArchitectureErrorMessages.ORGANIZATION_TOO_LONG,
              { max: this.maxLength },
            ),
          ],
    };
  }
}

export const ORGANIZATION_RULES = [
  new OrganizationRequiredRule(),
  new OrganizationMaxLengthRule(),
];
