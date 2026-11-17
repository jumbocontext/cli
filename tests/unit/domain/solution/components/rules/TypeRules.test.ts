/**
 * Tests for Component Type validation rules
 */

import { TypeRequiredRule, TypeValidRule } from "../../../../../../src/domain/components/rules/TypeRules";
import { ComponentType } from "../../../../../../src/domain/components/Constants";

describe("Component Type Rules", () => {
  describe("TypeRequiredRule", () => {
    const rule = new TypeRequiredRule();

    it("should pass for valid type", () => {
      const result = rule.validate("service");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for empty string", () => {
      const result = rule.validate("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Component type must be provided");
    });

    it("should fail for whitespace only", () => {
      const result = rule.validate("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Component type must be provided");
    });
  });

  describe("TypeValidRule", () => {
    const rule = new TypeValidRule();

    it("should pass for service type", () => {
      const result = rule.validate(ComponentType.SERVICE);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass for db type", () => {
      const result = rule.validate(ComponentType.DB);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass for all valid types", () => {
      const validTypes = Object.values(ComponentType);
      validTypes.forEach(type => {
        const result = rule.validate(type);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it("should fail for invalid type", () => {
      const result = rule.validate("invalid_type");
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Component type must be one of:");
      expect(result.errors[0]).toContain("service");
      expect(result.errors[0]).toContain("db");
    });
  });
});
