/**
 * Tests for Title validation rules
 */

import {
  TitleRequiredRule,
  TitleMaxLengthRule,
  TITLE_RULES,
} from "../../../../../../src/domain/goals/rules/TitleRules";
import { ValidationRuleSet } from "../../../../../../src/domain/validation/ValidationRule";
import { GoalLimits } from "../../../../../../src/domain/goals/Constants";

describe("TitleRules", () => {
  describe("TitleRequiredRule", () => {
    it("should pass for valid title", () => {
      const rule = new TitleRequiredRule();
      const result = rule.validate("Implement auth");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for empty title", () => {
      const rule = new TitleRequiredRule();
      const result = rule.validate("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Goal title must be provided");
    });

    it("should fail for whitespace-only title", () => {
      const rule = new TitleRequiredRule();
      const result = rule.validate("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Goal title must be provided");
    });
  });

  describe("TitleMaxLengthRule", () => {
    it("should pass for title within limit", () => {
      const rule = new TitleMaxLengthRule();
      const title = "a".repeat(GoalLimits.TITLE_MAX_LENGTH); // Exactly at limit
      const result = rule.validate(title);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for title exceeding limit", () => {
      const rule = new TitleMaxLengthRule();
      const title = "a".repeat(GoalLimits.TITLE_MAX_LENGTH + 1); // Over limit
      const result = rule.validate(title);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Title must be less than");
      expect(result.errors[0]).toContain(String(GoalLimits.TITLE_MAX_LENGTH));
    });

    it("should respect custom max length", () => {
      const rule = new TitleMaxLengthRule(30);
      const title = "a".repeat(31);
      const result = rule.validate(title);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("30");
    });
  });

  describe("TITLE_RULES ensemble", () => {
    it("should pass for valid title", () => {
      expect(() =>
        ValidationRuleSet.ensure("Implement auth", TITLE_RULES)
      ).not.toThrow();
    });

    it("should throw for empty title", () => {
      expect(() => ValidationRuleSet.ensure("", TITLE_RULES)).toThrow(
        "Goal title must be provided"
      );
    });

    it("should throw for too long title", () => {
      const longTitle = "a".repeat(GoalLimits.TITLE_MAX_LENGTH + 1);
      expect(() => ValidationRuleSet.ensure(longTitle, TITLE_RULES)).toThrow(
        "Title must be less than"
      );
    });
  });
});
