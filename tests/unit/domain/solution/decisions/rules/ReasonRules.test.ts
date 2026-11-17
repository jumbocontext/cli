/**
 * Tests for ReasonRules validation
 */

import { ReasonRequiredRule, ReasonMaxLengthRule, REASON_RULES } from "../../../../../../src/domain/decisions/rules/ReasonRules.js";
import { DecisionLimits } from "../../../../../../src/domain/decisions/Constants.js";

describe("ReasonRules", () => {
  describe("ReasonRequiredRule", () => {
    const rule = new ReasonRequiredRule();

    it("should pass for valid reason", () => {
      const result = rule.validate("Valid reason for reversal");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for empty string", () => {
      const result = rule.validate("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Reason for reversal must be provided");
    });

    it("should fail for whitespace-only string", () => {
      const result = rule.validate("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Reason for reversal must be provided");
    });

    it("should pass for string with leading/trailing whitespace", () => {
      const result = rule.validate("  Valid reason  ");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("ReasonMaxLengthRule", () => {
    const rule = new ReasonMaxLengthRule();

    it("should pass for reason within limit", () => {
      const reason = "A".repeat(DecisionLimits.REASON_MAX_LENGTH);
      const result = rule.validate(reason);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for reason at limit", () => {
      const reason = "A".repeat(DecisionLimits.REASON_MAX_LENGTH);
      const result = rule.validate(reason);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when reason exceeds limit", () => {
      const reason = "A".repeat(DecisionLimits.REASON_MAX_LENGTH + 1);
      const result = rule.validate(reason);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Reversal reason must be less than");
      expect(result.errors[0]).toContain(String(DecisionLimits.REASON_MAX_LENGTH));
    });

    it("should use custom max length when provided", () => {
      const customRule = new ReasonMaxLengthRule(10);
      const result = customRule.validate("A".repeat(11));
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("10");
    });
  });

  describe("REASON_RULES composite", () => {
    it("should include both required and max length rules", () => {
      expect(REASON_RULES).toHaveLength(2);
      expect(REASON_RULES[0]).toBeInstanceOf(ReasonRequiredRule);
      expect(REASON_RULES[1]).toBeInstanceOf(ReasonMaxLengthRule);
    });
  });
});
