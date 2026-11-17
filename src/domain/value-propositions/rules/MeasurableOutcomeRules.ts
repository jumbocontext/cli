import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ValuePropositionErrorMessages,
  ValuePropositionLimits,
  formatErrorMessage,
} from "../Constants.js";

export class MeasurableOutcomeMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = ValuePropositionLimits.MEASURABLE_OUTCOME_MAX_LENGTH,
  ) {}

  validate(measurableOutcome: string): ValidationResult {
    const isValid = measurableOutcome.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(
              ValuePropositionErrorMessages.MEASURABLE_OUTCOME_TOO_LONG,
              { max: this.maxLength },
            ),
          ],
    };
  }
}

// Measurable outcome is optional, so only max length validation needed
export const MEASURABLE_OUTCOME_RULES = [new MeasurableOutcomeMaxLengthRule()];
