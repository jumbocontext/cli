import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import { RelationErrorMessages } from "../Constants.js";

export class RelationIdRequiredRule implements ValidationRule<string> {
  validate(relationId: string): ValidationResult {
    const isValid = !!(relationId && relationId.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [RelationErrorMessages.RELATION_ID_REQUIRED],
    };
  }
}

export const RELATION_ID_RULES = [new RelationIdRequiredRule()];
