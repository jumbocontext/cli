/**
 * Tests for Architecture description validation rules
 */

import {
  DescriptionRequiredRule,
  DescriptionMaxLengthRule,
  DESCRIPTION_RULES
} from "../../../../../../src/domain/architecture/rules/DescriptionRules.js";
import { ValidationRuleSet } from "../../../../../../src/domain/validation/ValidationRule.js";

describe("DescriptionRequiredRule", () => {
  it("should pass for valid description", () => {
    const rule = new DescriptionRequiredRule();
    const result = rule.validate("Valid description");
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail for empty string", () => {
    const rule = new DescriptionRequiredRule();
    const result = rule.validate("");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Architecture description must be provided");
  });

  it("should fail for whitespace-only string", () => {
    const rule = new DescriptionRequiredRule();
    const result = rule.validate("   ");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Architecture description must be provided");
  });
});

describe("DescriptionMaxLengthRule", () => {
  it("should pass for description within limit", () => {
    const rule = new DescriptionMaxLengthRule(500);
    const result = rule.validate("Short description");
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should pass for description at exact limit", () => {
    const rule = new DescriptionMaxLengthRule(500);
    const description = "A".repeat(500);
    const result = rule.validate(description);
    expect(result.isValid).toBe(true);
  });

  it("should fail for description exceeding limit", () => {
    const rule = new DescriptionMaxLengthRule(500);
    const description = "A".repeat(501);
    const result = rule.validate(description);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Architecture description must be less than");
  });
});

describe("DESCRIPTION_RULES", () => {
  it("should pass valid description through all rules", () => {
    expect(() => {
      ValidationRuleSet.ensure("Valid description", DESCRIPTION_RULES);
    }).not.toThrow();
  });

  it("should throw for empty description", () => {
    expect(() => {
      ValidationRuleSet.ensure("", DESCRIPTION_RULES);
    }).toThrow("Architecture description must be provided");
  });

  it("should throw for description exceeding max length", () => {
    const longDescription = "A".repeat(501);
    expect(() => {
      ValidationRuleSet.ensure(longDescription, DESCRIPTION_RULES);
    }).toThrow("Architecture description must be less than");
  });
});
