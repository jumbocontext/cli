import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  RelationErrorMessages,
  RelationLimits,
  formatErrorMessage,
} from "../Constants.js";

export class DescriptionRequiredRule implements ValidationRule<string> {
  validate(description: string): ValidationResult {
    const isValid = !!(description && description.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [RelationErrorMessages.DESCRIPTION_REQUIRED],
    };
  }
}

export class DescriptionMaxLengthRule implements ValidationRule<string> {
  validate(description: string): ValidationResult {
    const isValid = description.length <= RelationLimits.DESCRIPTION_MAX_LENGTH;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(RelationErrorMessages.DESCRIPTION_TOO_LONG, {
              max: RelationLimits.DESCRIPTION_MAX_LENGTH,
            }),
          ],
    };
  }
}

export const DESCRIPTION_RULES = [
  new DescriptionRequiredRule(),
  new DescriptionMaxLengthRule(),
];
