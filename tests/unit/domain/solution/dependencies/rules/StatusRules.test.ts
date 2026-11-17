/**
 * Tests for Status validation rules
 */

import {
  StatusValueRule,
  STATUS_RULES,
} from "../../../../../../src/domain/dependencies/rules/StatusRules";
import { ValidationRuleSet } from "../../../../../../src/domain/validation/ValidationRule";
import { DependencyStatus } from "../../../../../../src/domain/dependencies/Constants";
import type { DependencyStatusType } from "../../../../../../src/domain/dependencies/Constants";

describe("StatusRules", () => {
  describe("StatusValueRule", () => {
    it("should pass for active status", () => {
      const rule = new StatusValueRule();
      const result = rule.validate(DependencyStatus.ACTIVE);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for deprecated status", () => {
      const rule = new StatusValueRule();
      const result = rule.validate(DependencyStatus.DEPRECATED);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass for removed status", () => {
      const rule = new StatusValueRule();
      const result = rule.validate(DependencyStatus.REMOVED);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail for invalid status", () => {
      const rule = new StatusValueRule();
      const result = rule.validate("invalid" as unknown as DependencyStatusType);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Status must be one of: active, deprecated, removed");
    });
  });

  describe("STATUS_RULES ensemble", () => {
    it("should pass for valid status", () => {
      expect(() =>
        ValidationRuleSet.ensure(DependencyStatus.ACTIVE, STATUS_RULES)
      ).not.toThrow();
    });

    it("should throw for invalid status", () => {
      expect(() => ValidationRuleSet.ensure("invalid" as unknown as DependencyStatusType, STATUS_RULES)).toThrow(
        "Status must be one of: active, deprecated, removed"
      );
    });
  });
});
