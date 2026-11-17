import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import { DecisionErrorMessages } from "../Constants.js";

export class SupersededByRequiredRule implements ValidationRule<string> {
  validate(supersededBy: string): ValidationResult {
    const isValid = !!(supersededBy && supersededBy.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [DecisionErrorMessages.SUPERSEDED_BY_REQUIRED],
    };
  }
}

export const SUPERSEDED_BY_RULES = [new SupersededByRequiredRule()];
