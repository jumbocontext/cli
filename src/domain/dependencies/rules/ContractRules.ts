import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  DependencyErrorMessages,
  DependencyLimits,
  formatErrorMessage,
} from "../Constants.js";

export class ContractMaxLengthRule implements ValidationRule<string> {
  constructor(
    private maxLength: number = DependencyLimits.CONTRACT_MAX_LENGTH,
  ) {}

  validate(contract: string): ValidationResult {
    const isValid = contract.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(DependencyErrorMessages.CONTRACT_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const CONTRACT_RULES = [new ContractMaxLengthRule()];
