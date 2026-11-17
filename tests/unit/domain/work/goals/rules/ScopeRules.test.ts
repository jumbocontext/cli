/**
 * Tests for Scope validation rules
 */

import {
  ScopeMaxCountRule,
  ScopeItemMaxLengthRule,
  SCOPE_RULES,
} from "../../../../../../src/domain/goals/rules/ScopeRules";
import { ValidationRuleSet } from "../../../../../../src/domain/validation/ValidationRule";
import { GoalLimits } from "../../../../../../src/domain/goals/Constants";

describe("ScopeRules", () => {
  describe("ScopeMaxCountRule", () => {
    it("should pass for valid scope count", () => {
      const rule = new ScopeMaxCountRule();
      const result = rule.validate(["src/domain", "src/application"]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for empty scope", () => {
      const rule = new ScopeMaxCountRule();
      const result = rule.validate([]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for scope at the limit", () => {
      const rule = new ScopeMaxCountRule();
      const scopeItems = Array.from(
        { length: GoalLimits.MAX_SCOPE_ITEMS },
        (_, i) => `scope_${i}`
      );
      const result = rule.validate(scopeItems);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for scope exceeding limit", () => {
      const rule = new ScopeMaxCountRule();
      const scopeItems = Array.from(
        { length: GoalLimits.MAX_SCOPE_ITEMS + 1 },
        (_, i) => `scope_${i}`
      );
      const result = rule.validate(scopeItems);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot have more than");
      expect(result.errors[0]).toContain(String(GoalLimits.MAX_SCOPE_ITEMS));
    });

    it("should respect custom max count", () => {
      const rule = new ScopeMaxCountRule(5);
      const scopeItems = ["a", "b", "c", "d", "e", "f"];
      const result = rule.validate(scopeItems);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("5");
    });
  });

  describe("ScopeItemMaxLengthRule", () => {
    it("should pass for valid scope item lengths", () => {
      const rule = new ScopeItemMaxLengthRule();
      const result = rule.validate([
        "src/domain/goals",
        "src/domain/goals",
      ]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for empty scope", () => {
      const rule = new ScopeItemMaxLengthRule();
      const result = rule.validate([]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for scope item at the limit", () => {
      const rule = new ScopeItemMaxLengthRule();
      const itemAtLimit = "a".repeat(GoalLimits.SCOPE_ITEM_MAX_LENGTH);
      const result = rule.validate([itemAtLimit]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for scope item exceeding limit", () => {
      const rule = new ScopeItemMaxLengthRule();
      const longItem = "a".repeat(GoalLimits.SCOPE_ITEM_MAX_LENGTH + 1);
      const result = rule.validate([longItem]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Scope item must be less than");
      expect(result.errors[0]).toContain(String(GoalLimits.SCOPE_ITEM_MAX_LENGTH));
    });

    it("should fail if any scope item exceeds limit", () => {
      const rule = new ScopeItemMaxLengthRule();
      const validItem = "src/valid";
      const longItem = "a".repeat(GoalLimits.SCOPE_ITEM_MAX_LENGTH + 1);
      const result = rule.validate([validItem, longItem]);
      expect(result.isValid).toBe(false);
    });

    it("should respect custom max length", () => {
      const rule = new ScopeItemMaxLengthRule(50);
      const item = "a".repeat(51);
      const result = rule.validate([item]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("50");
    });
  });

  describe("SCOPE_RULES ensemble", () => {
    it("should pass for valid scope", () => {
      expect(() =>
        ValidationRuleSet.ensure(
          ["src/domain", "src/application", "tests/"],
          SCOPE_RULES
        )
      ).not.toThrow();
    });

    it("should pass for empty scope", () => {
      expect(() =>
        ValidationRuleSet.ensure([], SCOPE_RULES)
      ).not.toThrow();
    });

    it("should throw for too many scope items", () => {
      const scopeItems = Array.from(
        { length: GoalLimits.MAX_SCOPE_ITEMS + 1 },
        (_, i) => `scope_${i}`
      );
      expect(() =>
        ValidationRuleSet.ensure(scopeItems, SCOPE_RULES)
      ).toThrow("Cannot have more than");
    });

    it("should throw for scope item too long", () => {
      const longItem = "a".repeat(GoalLimits.SCOPE_ITEM_MAX_LENGTH + 1);
      expect(() =>
        ValidationRuleSet.ensure([longItem], SCOPE_RULES)
      ).toThrow("Scope item must be less than");
    });
  });
});
