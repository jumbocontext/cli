import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyLimits,
  formatErrorMessage,
} from "../Constants.js";

export class EndpointMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = DependencyLimits.ENDPOINT_MAX_LENGTH,
  ) {}

  validate(endpoint: string): ValidationResult {
    const isValid = endpoint.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DependencyErrorMessages.ENDPOINT_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const ENDPOINT_RULES = [new EndpointMaxLengthRule()];
