/**
 * Tests for Focus validation rules
 */

import {
  FocusRequiredRule,
  FocusMaxLengthRule,
} from "../../../../../../src/domain/sessions/rules/FocusRules";
import { SessionLimits } from "../../../../../../src/domain/sessions/Constants";

describe("FocusRequiredRule", () => {
  const rule = new FocusRequiredRule();

  it("should pass for valid focus", () => {
    const result = rule.validate("Implement feature");
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail for empty string", () => {
    const result = rule.validate("");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Session focus must be provided");
  });

  it("should fail for whitespace only", () => {
    const result = rule.validate("   ");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Session focus must be provided");
  });
});

describe("FocusMaxLengthRule", () => {
  it("should pass for focus within limit", () => {
    const rule = new FocusMaxLengthRule();
    const result = rule.validate("Valid focus");
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should pass for focus at exact limit", () => {
    const rule = new FocusMaxLengthRule();
    const focus = "a".repeat(SessionLimits.FOCUS_MAX_LENGTH);
    const result = rule.validate(focus);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail for focus exceeding limit", () => {
    const rule = new FocusMaxLengthRule();
    const focus = "a".repeat(SessionLimits.FOCUS_MAX_LENGTH + 1);
    const result = rule.validate(focus);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Session focus must be less than 200 characters"
    );
  });

  it("should use custom max length when provided", () => {
    const rule = new FocusMaxLengthRule(10);
    const result = rule.validate("a".repeat(11));
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Session focus must be less than 10 characters"
    );
  });
});
