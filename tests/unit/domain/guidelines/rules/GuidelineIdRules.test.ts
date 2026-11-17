/**
 * Tests for GuidelineIdRules
 */

import { GuidelineIdRequiredRule } from "../../../../../src/domain/guidelines/rules/GuidelineIdRules";
import { GuidelineErrorMessages } from "../../../../../src/domain/guidelines/Constants";

describe("GuidelineIdRules", () => {
  describe("GuidelineIdRequiredRule", () => {
    it("should pass validation for valid guideline ID", () => {
      // Arrange
      const rule = new GuidelineIdRequiredRule();

      // Act
      const result = rule.validate("gl_123");

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail validation for empty string", () => {
      // Arrange
      const rule = new GuidelineIdRequiredRule();

      // Act
      const result = rule.validate("");

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(GuidelineErrorMessages.ID_REQUIRED);
    });

    it("should fail validation for whitespace-only string", () => {
      // Arrange
      const rule = new GuidelineIdRequiredRule();

      // Act
      const result = rule.validate("   ");

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(GuidelineErrorMessages.ID_REQUIRED);
    });

    it("should pass validation for ID with spaces", () => {
      // Arrange
      const rule = new GuidelineIdRequiredRule();

      // Act
      const result = rule.validate("gl 123");

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
