import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ArchitectureErrorMessages,
  ArchitectureLimits,
  formatErrorMessage,
} from "../Constants.js";

export class PrincipleMaxLengthRule implements ValidationRule<string[]> {
  constructor(
    private maxLength: number = ArchitectureLimits.PRINCIPLE_MAX_LENGTH,
  ) {}

  validate(principles: string[]): ValidationResult {
    const errors: string[] = [];
    for (const principle of principles) {
      if (principle.length > this.maxLength) {
        errors.push(
          formatErrorMessage(ArchitectureErrorMessages.PRINCIPLE_TOO_LONG, {
            max: this.maxLength,
          }),
        );
        break; // Only report once
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export class PrinciplesMaxCountRule implements ValidationRule<string[]> {
  constructor(private maxCount: number = ArchitectureLimits.MAX_PRINCIPLES) {}

  validate(principles: string[]): ValidationResult {
    const isValid = principles.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ArchitectureErrorMessages.TOO_MANY_PRINCIPLES, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export const PRINCIPLES_RULES = [
  new PrincipleMaxLengthRule(),
  new PrinciplesMaxCountRule(),
];
