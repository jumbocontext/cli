/**
 * Tests for Component Deprecation Reason validation rules
 */

import { DeprecationReasonMaxLengthRule } from "../../../../../../src/domain/components/rules/DeprecationReasonRules";
import { ComponentLimits } from "../../../../../../src/domain/components/Constants";

describe("Component Deprecation Reason Rules", () => {
  describe("DeprecationReasonMaxLengthRule", () => {
    const rule = new DeprecationReasonMaxLengthRule();

    it("should pass for reason at max length", () => {
      const reason = "a".repeat(ComponentLimits.DEPRECATION_REASON_MAX_LENGTH);
      const result = rule.validate(reason);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass for reason below max length", () => {
      const result = rule.validate("Replaced by NewAuthMiddleware");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for reason exceeding max length", () => {
      const reason = "a".repeat(ComponentLimits.DEPRECATION_REASON_MAX_LENGTH + 1);
      const result = rule.validate(reason);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Deprecation reason must be less than ${ComponentLimits.DEPRECATION_REASON_MAX_LENGTH} characters`
      );
    });

    it("should pass for empty string", () => {
      const result = rule.validate("");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass for short reason", () => {
      const result = rule.validate("Deprecated");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
