import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GoalErrorMessages,
  GoalLimits,
  formatErrorMessage,
} from "../Constants.js";

export class FilePathMaxLengthRule implements ValidationRule<string[]> {
  constructor(private maxLength: number = GoalLimits.FILE_PATH_MAX_LENGTH) {}

  validate(filePaths: string[]): ValidationResult {
    const tooLong = filePaths.find((path) => path.length > this.maxLength);
    const isValid = !tooLong;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.FILE_PATH_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

export const FILE_PATH_RULES = [new FilePathMaxLengthRule()];
