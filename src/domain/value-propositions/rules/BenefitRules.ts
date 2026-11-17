import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ValuePropositionErrorMessages,
  ValuePropositionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class BenefitRequiredRule implements ValidationRule<string> {
  validate(benefit: string): ValidationResult {
    const isValid = !!(benefit && benefit.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [ValuePropositionErrorMessages.BENEFIT_REQUIRED],
    };
  }
}

export class BenefitMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = ValuePropositionLimits.BENEFIT_MAX_LENGTH,
  ) {}

  validate(benefit: string): ValidationResult {
    const isValid = benefit.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ValuePropositionErrorMessages.BENEFIT_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const BENEFIT_RULES = [
  new BenefitRequiredRule(),
  new BenefitMaxLengthRule(),
];
