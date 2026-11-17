/**
 * Tests for Objective validation rules
 */

import {
  ObjectiveRequiredRule,
  ObjectiveMaxLengthRule,
  OBJECTIVE_RULES,
} from "../../../../../../src/domain/goals/rules/ObjectiveRules";
import { ValidationRuleSet } from "../../../../../../src/domain/validation/ValidationRule";
import { GoalLimits } from "../../../../../../src/domain/goals/Constants";

describe("ObjectiveRules", () => {
  describe("ObjectiveRequiredRule", () => {
    it("should pass for valid objective", () => {
      const rule = new ObjectiveRequiredRule();
      const result = rule.validate("Implement authentication");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for empty objective", () => {
      const rule = new ObjectiveRequiredRule();
      const result = rule.validate("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Goal objective must be provided");
    });

    it("should fail for whitespace-only objective", () => {
      const rule = new ObjectiveRequiredRule();
      const result = rule.validate("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Goal objective must be provided");
    });
  });

  describe("ObjectiveMaxLengthRule", () => {
    it("should pass for objective within limit", () => {
      const rule = new ObjectiveMaxLengthRule();
      const objective = "a".repeat(GoalLimits.OBJECTIVE_MAX_LENGTH); // Exactly at limit
      const result = rule.validate(objective);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for objective exceeding limit", () => {
      const rule = new ObjectiveMaxLengthRule();
      const objective = "a".repeat(GoalLimits.OBJECTIVE_MAX_LENGTH + 1); // Over limit
      const result = rule.validate(objective);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Objective must be less than");
      expect(result.errors[0]).toContain(String(GoalLimits.OBJECTIVE_MAX_LENGTH));
    });

    it("should respect custom max length", () => {
      const rule = new ObjectiveMaxLengthRule(50);
      const objective = "a".repeat(51);
      const result = rule.validate(objective);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("50");
    });
  });

  describe("OBJECTIVE_RULES ensemble", () => {
    it("should pass for valid objective", () => {
      expect(() =>
        ValidationRuleSet.ensure("Implement authentication", OBJECTIVE_RULES)
      ).not.toThrow();
    });

    it("should throw for empty objective", () => {
      expect(() => ValidationRuleSet.ensure("", OBJECTIVE_RULES)).toThrow(
        "Goal objective must be provided"
      );
    });

    it("should throw for too long objective", () => {
      const longObjective = "a".repeat(GoalLimits.OBJECTIVE_MAX_LENGTH + 1);
      expect(() => ValidationRuleSet.ensure(longObjective, OBJECTIVE_RULES)).toThrow(
        "Objective must be less than"
      );
    });
  });
});
