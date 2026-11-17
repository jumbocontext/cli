import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GoalErrorMessages,
  GoalLimits,
  formatErrorMessage,
} from "../Constants.js";

/**
 * Validates that a note is provided (not empty or whitespace).
 */
export class NoteRequiredRule implements ValidationRule<string> {
  validate(note: string): ValidationResult {
    const isValid = !!(note && note.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [GoalErrorMessages.NOTE_REQUIRED],
    };
  }
}

/**
 * Validates that a note does not exceed maximum length.
 */
export class NoteMaxLengthRule implements ValidationRule<string> {
  constructor(private maxLength: number = GoalLimits.NOTE_MAX_LENGTH) {}

  validate(note: string): ValidationResult {
    const isValid = note.length <= this.maxLength;
    return {
      isValid,
      errors: isValid
        ? []
        : [
            formatErrorMessage(GoalErrorMessages.NOTE_TOO_LONG, {
              max: this.maxLength,
            }),
          ],
    };
  }
}

/**
 * Composite set of validation rules for required note fields.
 * Used when blocking or completing goals.
 */
export const NOTE_RULES = [new NoteRequiredRule(), new NoteMaxLengthRule()];

/**
 * Composite set of validation rules for optional note fields.
 * Used when unblocking goals (resolution note is optional).
 * Only validates length if note is provided.
 */
export const OPTIONAL_NOTE_RULES = [new NoteMaxLengthRule()];
