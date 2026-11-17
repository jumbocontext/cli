import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import { RelationErrorMessages, RelationLimits } from "../Constants.js";

export class RelationTypeRequiredRule implements ValidationRule<string> {
  validate(relationType: string): ValidationResult {
    const isValid = !!(relationType && relationType.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [RelationErrorMessages.RELATION_TYPE_REQUIRED],
    };
  }
}

export class RelationTypeMaxLengthRule implements ValidationRule<string> {
  validate(relationType: string): ValidationResult {
    const isValid =
      relationType.length <= RelationLimits.RELATION_TYPE_MAX_LENGTH;
    return {
      isValid,
      errors: isValid ? [] : [RelationErrorMessages.RELATION_TYPE_INVALID],
    };
  }
}

export const RELATION_TYPE_RULES = [
  new RelationTypeRequiredRule(),
  new RelationTypeMaxLengthRule(),
];
