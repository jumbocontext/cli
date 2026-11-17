/**
 * Validation rules for guideline category field.
 */

import {
  ValidationRule,
  ValidationResult,
} from "../../validation/ValidationRule.js";
import {
  GuidelineErrorMessages,
  GuidelineCategory,
  GuidelineCategoryValue,
} from "../Constants.js";

export class CategoryRequiredRule implements ValidationRule<string> {
  validate(category: string): ValidationResult {
    const isValid = !!(category && category.trim() !== "");
    return {
      isValid,
      errors: isValid ? [] : [GuidelineErrorMessages.CATEGORY_REQUIRED],
    };
  }
}

export class CategoryValidValueRule implements ValidationRule<string> {
  validate(category: string): ValidationResult {
    const validCategories = Object.values(GuidelineCategory);
    const isValid = validCategories.includes(
      category as GuidelineCategoryValue,
    );
    return {
      isValid,
      errors: isValid ? [] : [GuidelineErrorMessages.CATEGORY_INVALID],
    };
  }
}

export const CATEGORY_RULES = [
  new CategoryRequiredRule(),
  new CategoryValidValueRule(),
];
