/**
 * Tests for SupersededByRules validation
 */

import { SupersededByRequiredRule, SUPERSEDED_BY_RULES } from "../../../../../../src/domain/decisions/rules/SupersededByRules.js";

describe("SupersededByRules", () => {
  describe("SupersededByRequiredRule", () => {
    const rule = new SupersededByRequiredRule();

    it("should pass for valid supersededBy ID", () => {
      const result = rule.validate("dec_456");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for empty string", () => {
      const result = rule.validate("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("SupersededBy decision ID must be provided");
    });

    it("should fail for whitespace-only string", () => {
      const result = rule.validate("   ");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("SupersededBy decision ID must be provided");
    });

    it("should pass for string with leading/trailing whitespace", () => {
      const result = rule.validate("  dec_456  ");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("SUPERSEDED_BY_RULES composite", () => {
    it("should include required rule", () => {
      expect(SUPERSEDED_BY_RULES).toHaveLength(1);
      expect(SUPERSEDED_BY_RULES[0]).toBeInstanceOf(SupersededByRequiredRule);
    });
  });
});
