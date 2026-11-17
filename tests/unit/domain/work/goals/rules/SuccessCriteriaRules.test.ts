/**
 * Tests for SuccessCriteria validation rules
 */

import {
  SuccessCriteriaRequiredRule,
  SuccessCriteriaMaxCountRule,
  SuccessCriterionMaxLengthRule,
  SUCCESS_CRITERIA_RULES,
} from "../../../../../../src/domain/goals/rules/SuccessCriteriaRules";
import { ValidationRuleSet } from "../../../../../../src/domain/validation/ValidationRule";
import { GoalLimits } from "../../../../../../src/domain/goals/Constants";

describe("SuccessCriteriaRules", () => {
  describe("SuccessCriteriaRequiredRule", () => {
    it("should pass for valid criteria", () => {
      const rule = new SuccessCriteriaRequiredRule();
      const result = rule.validate(["Criterion 1", "Criterion 2"]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for single criterion", () => {
      const rule = new SuccessCriteriaRequiredRule();
      const result = rule.validate(["Single criterion"]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for empty criteria array", () => {
      const rule = new SuccessCriteriaRequiredRule();
      const result = rule.validate([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("At least one success criterion must be provided");
    });
  });

  describe("SuccessCriteriaMaxCountRule", () => {
    it("should pass for valid criteria count", () => {
      const rule = new SuccessCriteriaMaxCountRule();
      const result = rule.validate(["Criterion 1", "Criterion 2", "Criterion 3"]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for criteria at the limit", () => {
      const rule = new SuccessCriteriaMaxCountRule();
      const criteria = Array.from(
        { length: GoalLimits.MAX_SUCCESS_CRITERIA },
        (_, i) => `Criterion ${i + 1}`
      );
      const result = rule.validate(criteria);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for criteria exceeding limit", () => {
      const rule = new SuccessCriteriaMaxCountRule();
      const criteria = Array.from(
        { length: GoalLimits.MAX_SUCCESS_CRITERIA + 1 },
        (_, i) => `Criterion ${i + 1}`
      );
      const result = rule.validate(criteria);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot have more than");
      expect(result.errors[0]).toContain(String(GoalLimits.MAX_SUCCESS_CRITERIA));
    });

    it("should respect custom max count", () => {
      const rule = new SuccessCriteriaMaxCountRule(3);
      const criteria = ["a", "b", "c", "d"];
      const result = rule.validate(criteria);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("3");
    });
  });

  describe("SuccessCriterionMaxLengthRule", () => {
    it("should pass for valid criterion lengths", () => {
      const rule = new SuccessCriterionMaxLengthRule();
      const result = rule.validate([
        "User can log in with email and password",
        "System validates input and shows appropriate errors",
      ]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for criterion at the limit", () => {
      const rule = new SuccessCriterionMaxLengthRule();
      const criterionAtLimit = "a".repeat(GoalLimits.SUCCESS_CRITERION_MAX_LENGTH);
      const result = rule.validate([criterionAtLimit]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for criterion exceeding limit", () => {
      const rule = new SuccessCriterionMaxLengthRule();
      const longCriterion = "a".repeat(GoalLimits.SUCCESS_CRITERION_MAX_LENGTH + 1);
      const result = rule.validate([longCriterion]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Success criterion must be less than");
      expect(result.errors[0]).toContain(String(GoalLimits.SUCCESS_CRITERION_MAX_LENGTH));
    });

    it("should fail if any criterion exceeds limit", () => {
      const rule = new SuccessCriterionMaxLengthRule();
      const validCriterion = "Valid criterion";
      const longCriterion = "a".repeat(GoalLimits.SUCCESS_CRITERION_MAX_LENGTH + 1);
      const result = rule.validate([validCriterion, longCriterion]);
      expect(result.isValid).toBe(false);
    });

    it("should respect custom max length", () => {
      const rule = new SuccessCriterionMaxLengthRule(50);
      const criterion = "a".repeat(51);
      const result = rule.validate([criterion]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("50");
    });
  });

  describe("SUCCESS_CRITERIA_RULES ensemble", () => {
    it("should pass for valid criteria", () => {
      expect(() =>
        ValidationRuleSet.ensure(
          ["Criterion 1", "Criterion 2", "Criterion 3"],
          SUCCESS_CRITERIA_RULES
        )
      ).not.toThrow();
    });

    it("should throw for empty criteria", () => {
      expect(() =>
        ValidationRuleSet.ensure([], SUCCESS_CRITERIA_RULES)
      ).toThrow("At least one success criterion must be provided");
    });

    it("should throw for too many criteria", () => {
      const criteria = Array.from(
        { length: GoalLimits.MAX_SUCCESS_CRITERIA + 1 },
        (_, i) => `Criterion ${i + 1}`
      );
      expect(() =>
        ValidationRuleSet.ensure(criteria, SUCCESS_CRITERIA_RULES)
      ).toThrow("Cannot have more than");
    });

    it("should throw for criterion too long", () => {
      const longCriterion = "a".repeat(GoalLimits.SUCCESS_CRITERION_MAX_LENGTH + 1);
      expect(() =>
        ValidationRuleSet.ensure([longCriterion], SUCCESS_CRITERIA_RULES)
      ).toThrow("Success criterion must be less than");
    });
  });
});
