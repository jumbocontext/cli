import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  ArchitectureErrorMessages,
  ArchitectureLimits,
  formatErrorMessage,
} from "../Constants.js";

export class StackItemMaxLengthRule implements ValidationRule<string[]> {
  constructor(
    private maxLength: number = ArchitectureLimits.STACK_ITEM_MAX_LENGTH,
  ) {}

  validate(stack: string[]): ValidationResult {
    const errors: string[] = [];
    for (const item of stack) {
      if (item.length > this.maxLength) {
        errors.push(
          formatErrorMessage(ArchitectureErrorMessages.STACK_ITEM_TOO_LONG, {
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

export class StackMaxCountRule implements ValidationRule<string[]> {
  constructor(private maxCount: number = ArchitectureLimits.MAX_STACK_ITEMS) {}

  validate(stack: string[]): ValidationResult {
    const isValid = stack.length <= this.maxCount;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(ArchitectureErrorMessages.TOO_MANY_STACK_ITEMS, {
              max: this.maxCount,
            }),
          ],
    };
  }
}

export const STACK_RULES = [
  new StackItemMaxLengthRule(),
  new StackMaxCountRule(),
];
