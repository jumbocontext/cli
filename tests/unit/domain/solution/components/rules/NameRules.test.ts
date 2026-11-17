/**
 * Tests for Component Name validation rules
 */

import { NameRequiredRule, NameMaxLengthRule } from "../../../../../../src/domain/components/rules/NameRules";
import { ComponentLimits } from "../../../../../../src/domain/components/Constants";

describe("Component Name Rules", () => {
  describe("NameRequiredRule", () => {
    const rule = new NameRequiredRule();

    it("should pass for valid name", () => {
      const result = rule.validate("UserController");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for empty string", () => {
      const result = rule.validate("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Component name must be provided");
    });

    it("should fail for whitespace only", () => {
      const result = rule.validate("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Component name must be provided");
    });
  });

  describe("NameMaxLengthRule", () => {
    const rule = new NameMaxLengthRule();

    it("should pass for name at max length", () => {
      const name = "a".repeat(ComponentLimits.NAME_MAX_LENGTH);
      const result = rule.validate(name);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass for name below max length", () => {
      const result = rule.validate("UserController");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for name exceeding max length", () => {
      const name = "a".repeat(ComponentLimits.NAME_MAX_LENGTH + 1);
      const result = rule.validate(name);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Component name must be less than ${ComponentLimits.NAME_MAX_LENGTH} characters`);
    });

    it("should allow custom max length", () => {
      const customRule = new NameMaxLengthRule(50);
      const name = "a".repeat(51);
      const result = customRule.validate(name);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Component name must be less than 50 characters");
    });
  });
});
