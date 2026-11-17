/**
 * Validation infrastructure for domain rules.
 * Provides a composable pattern for enforcing business invariants.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule<T> {
  // Synchronous validation method (backward compatible)
  validate?(value: T): ValidationResult;

  // Async validation method for I/O operations
  validateAsync?(value: T): Promise<ValidationResult>;
}

/**
 * Utility class for running multiple validation rules and aggregating results.
 */
export class ValidationRuleSet {
  /**
   * Ensures all rules pass for the given value.
   * Throws an error with all validation messages if any rule fails.
   *
   * @param value - The value to validate
   * @param rules - Array of validation rules to apply
   * @throws Error with aggregated validation messages if validation fails
   */
  static ensure<T>(value: T, rules: ValidationRule<T>[]): void {
    const errors: string[] = [];

    for (const rule of rules) {
      if (rule.validate) {
        const result = rule.validate(value);
        if (!result.isValid) {
          errors.push(...result.errors);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }

  /**
   * Validates a value against multiple rules without throwing.
   * Returns a ValidationResult with aggregated errors.
   *
   * @param value - The value to validate
   * @param rules - Array of validation rules to apply
   * @returns ValidationResult with all errors aggregated
   */
  static validate<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
      if (rule.validate) {
        const result = rule.validate(value);
        if (!result.isValid) {
          errors.push(...result.errors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Ensures all rules pass for the given value (async version).
   * Throws an error with all validation messages if any rule fails.
   * Supports both sync and async validation rules.
   *
   * @param value - The value to validate
   * @param rules - Array of validation rules to apply
   * @throws Error with aggregated validation messages if validation fails
   */
  static async ensureAsync<T>(
    value: T,
    rules: ValidationRule<T>[],
  ): Promise<void> {
    const result = await this.validateAsync(value, rules);
    if (!result.isValid) {
      throw new Error(result.errors.join("; "));
    }
  }

  /**
   * Validates a value against multiple rules without throwing (async version).
   * Returns a ValidationResult with aggregated errors.
   * Supports both sync and async validation rules.
   *
   * @param value - The value to validate
   * @param rules - Array of validation rules to apply
   * @returns ValidationResult with all errors aggregated
   */
  static async validateAsync<T>(
    value: T,
    rules: ValidationRule<T>[],
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    for (const rule of rules) {
      let result: ValidationResult;

      if (rule.validateAsync) {
        result = await rule.validateAsync(value);
      } else if (rule.validate) {
        result = rule.validate(value);
      } else {
        continue;
      }

      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
