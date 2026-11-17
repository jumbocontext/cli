import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ValuePropositionErrorMessages,
  ValuePropositionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class DescriptionRequiredRule implements ValidationRule<string> {
  validate(description: string): ValidationResult {
    const isValid = !!(description && description.trim() !== "");
    return {
      isValid,
      errors: isValid
        ? []
        : [ValuePropositionErrorMessages.DESCRIPTION_REQUIRED],
    };
  }
}

export class DescriptionMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = ValuePropositionLimits.DESCRIPTION_MAX_LENGTH,
  ) {}

  validate(description: string): ValidationResult {
    const isValid = description.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(
              ValuePropositionErrorMessages.DESCRIPTION_TOO_LONG,
              { max: this.maxLength },
            ),
          ],
    };
  }
}

export const DESCRIPTION_RULES = [
  new DescriptionRequiredRule(),
  new DescriptionMaxLengthRule(),
];
