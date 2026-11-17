/**
 * Tests for ValidationRule and ValidationRuleSet async functionality
 */

import {
  ValidationRule,
  ValidationResult,
  ValidationRuleSet,
} from "../../../../../src/domain/validation/ValidationRule.js";

// Mock synchronous rule
class MockSyncRule implements ValidationRule<string> {
  validate(value: string): ValidationResult {
    const isValid = value !== "invalid";
    return {
      isValid,
      errors: isValid ? [] : ["Synchronous validation failed"],
    };
  }
}

// Mock asynchronous rule
class MockAsyncRule implements ValidationRule<string> {
  async validateAsync(value: string): Promise<ValidationResult> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 1));

    const isValid = value !== "async-invalid";
    return {
      isValid,
      errors: isValid ? [] : ["Asynchronous validation failed"],
    };
  }
}

// Mock rule with both sync and async (async takes precedence)
class MockHybridRule implements ValidationRule<string> {
  validate(value: string): ValidationResult {
    return { isValid: false, errors: ["Sync should not be called"] };
  }

  async validateAsync(value: string): Promise<ValidationResult> {
    const isValid = value === "hybrid-valid";
    return {
      isValid,
      errors: isValid ? [] : ["Hybrid validation failed"],
    };
  }
}

describe("ValidationRuleSet.ensureAsync", () => {
  it("should pass when async rule validates successfully", async () => {
    const rules = [new MockAsyncRule()];
    await expect(
      ValidationRuleSet.ensureAsync("valid-value", rules)
    ).resolves.toBeUndefined();
  });

  it("should throw error when async rule fails", async () => {
    const rules = [new MockAsyncRule()];
    await expect(
      ValidationRuleSet.ensureAsync("async-invalid", rules)
    ).rejects.toThrow("Asynchronous validation failed");
  });

  it("should pass when sync rule validates successfully", async () => {
    const rules = [new MockSyncRule()];
    await expect(
      ValidationRuleSet.ensureAsync("valid-value", rules)
    ).resolves.toBeUndefined();
  });

  it("should throw error when sync rule fails", async () => {
    const rules = [new MockSyncRule()];
    await expect(
      ValidationRuleSet.ensureAsync("invalid", rules)
    ).rejects.toThrow("Synchronous validation failed");
  });

  it("should handle mix of sync and async rules", async () => {
    const rules = [new MockSyncRule(), new MockAsyncRule()];
    await expect(
      ValidationRuleSet.ensureAsync("valid-value", rules)
    ).resolves.toBeUndefined();
  });

  it("should throw error with aggregated errors from mixed rules", async () => {
    const rules = [new MockSyncRule(), new MockAsyncRule()];
    await expect(
      ValidationRuleSet.ensureAsync("invalid", rules)
    ).rejects.toThrow("Synchronous validation failed");

    await expect(
      ValidationRuleSet.ensureAsync("async-invalid", rules)
    ).rejects.toThrow("Asynchronous validation failed");
  });

  it("should aggregate multiple errors", async () => {
    const rules = [new MockSyncRule(), new MockAsyncRule()];

    // Create a value that fails both
    class FailBothRule implements ValidationRule<string> {
      validate(value: string): ValidationResult {
        return { isValid: false, errors: ["Sync error"] };
      }
      async validateAsync(value: string): Promise<ValidationResult> {
        return { isValid: false, errors: ["Async error"] };
      }
    }

    const failRules = [new FailBothRule()];
    await expect(
      ValidationRuleSet.ensureAsync("any", failRules)
    ).rejects.toThrow("Async error");
  });

  it("should prefer async validation when both methods exist", async () => {
    const rules = [new MockHybridRule()];
    await expect(
      ValidationRuleSet.ensureAsync("hybrid-valid", rules)
    ).resolves.toBeUndefined();

    await expect(
      ValidationRuleSet.ensureAsync("hybrid-invalid", rules)
    ).rejects.toThrow("Hybrid validation failed");
  });
});

describe("ValidationRuleSet.validateAsync", () => {
  it("should return valid result when async rule passes", async () => {
    const rules = [new MockAsyncRule()];
    const result = await ValidationRuleSet.validateAsync("valid-value", rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result with errors when async rule fails", async () => {
    const rules = [new MockAsyncRule()];
    const result = await ValidationRuleSet.validateAsync(
      "async-invalid",
      rules
    );
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Asynchronous validation failed"]);
  });

  it("should return valid result when sync rule passes", async () => {
    const rules = [new MockSyncRule()];
    const result = await ValidationRuleSet.validateAsync("valid-value", rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid result when sync rule fails", async () => {
    const rules = [new MockSyncRule()];
    const result = await ValidationRuleSet.validateAsync("invalid", rules);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(["Synchronous validation failed"]);
  });

  it("should aggregate errors from multiple rules", async () => {
    const rules = [new MockSyncRule(), new MockAsyncRule()];

    // Both rules should fail for their respective invalid values
    const invalidValue = "invalid"; // Fails sync rule
    const result1 = await ValidationRuleSet.validateAsync(invalidValue, rules);
    expect(result1.isValid).toBe(false);
    expect(result1.errors).toContain("Synchronous validation failed");

    const asyncInvalidValue = "async-invalid"; // Fails async rule
    const result2 = await ValidationRuleSet.validateAsync(
      asyncInvalidValue,
      rules
    );
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain("Asynchronous validation failed");
  });

  it("should handle empty rules array", async () => {
    const result = await ValidationRuleSet.validateAsync("any-value", []);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("ValidationRuleSet backward compatibility", () => {
  it("should still work with existing synchronous ensure method", () => {
    const rules = [new MockSyncRule()];
    expect(() => ValidationRuleSet.ensure("valid-value", rules)).not.toThrow();
    expect(() => ValidationRuleSet.ensure("invalid", rules)).toThrow(
      "Synchronous validation failed"
    );
  });

  it("should still work with existing synchronous validate method", () => {
    const rules = [new MockSyncRule()];
    const validResult = ValidationRuleSet.validate("valid-value", rules);
    expect(validResult.isValid).toBe(true);

    const invalidResult = ValidationRuleSet.validate("invalid", rules);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain("Synchronous validation failed");
  });
});
