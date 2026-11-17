/**
 * Tests for FilePath validation rules
 */

import {
  FilePathMaxLengthRule,
  FILE_PATH_RULES,
} from "../../../../../../src/domain/goals/rules/FilePathRules";
import { ValidationRuleSet } from "../../../../../../src/domain/validation/ValidationRule";
import { GoalLimits } from "../../../../../../src/domain/goals/Constants";

describe("FilePathRules", () => {
  describe("FilePathMaxLengthRule", () => {
    it("should pass for valid file paths", () => {
      const rule = new FilePathMaxLengthRule();
      const result = rule.validate([
        "src/domain/goals/Goal.ts",
        "tests/domain/goals/Goal.test.ts",
      ]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for empty array", () => {
      const rule = new FilePathMaxLengthRule();
      const result = rule.validate([]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for paths at the limit", () => {
      const rule = new FilePathMaxLengthRule();
      const pathAtLimit = "a".repeat(GoalLimits.FILE_PATH_MAX_LENGTH);
      const result = rule.validate([pathAtLimit]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for path exceeding limit", () => {
      const rule = new FilePathMaxLengthRule();
      const longPath = "a".repeat(GoalLimits.FILE_PATH_MAX_LENGTH + 1);
      const result = rule.validate([longPath]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("File path must be less than");
      expect(result.errors[0]).toContain(String(GoalLimits.FILE_PATH_MAX_LENGTH));
    });

    it("should fail if any path exceeds limit", () => {
      const rule = new FilePathMaxLengthRule();
      const validPath = "src/valid.ts";
      const longPath = "a".repeat(GoalLimits.FILE_PATH_MAX_LENGTH + 1);
      const result = rule.validate([validPath, longPath]);
      expect(result.isValid).toBe(false);
    });

    it("should respect custom max length", () => {
      const rule = new FilePathMaxLengthRule(50);
      const path = "a".repeat(51);
      const result = rule.validate([path]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("50");
    });
  });

  describe("FILE_PATH_RULES ensemble", () => {
    it("should pass for valid file paths", () => {
      expect(() =>
        ValidationRuleSet.ensure(
          ["src/index.ts", "package.json"],
          FILE_PATH_RULES
        )
      ).not.toThrow();
    });

    it("should throw for too long path", () => {
      const longPath = "a".repeat(GoalLimits.FILE_PATH_MAX_LENGTH + 1);
      expect(() =>
        ValidationRuleSet.ensure([longPath], FILE_PATH_RULES)
      ).toThrow("File path must be less than");
    });
  });
});
