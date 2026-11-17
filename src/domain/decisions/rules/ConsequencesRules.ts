import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DecisionErrorMessages,
  DecisionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ConsequencesMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = DecisionLimits.CONSEQUENCES_MAX_LENGTH,
  ) {}

  validate(consequences: string): ValidationResult {
    const isValid = consequences.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DecisionErrorMessages.CONSEQUENCES_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const CONSEQUENCES_RULES = [new ConsequencesMaxLengthRule()];
