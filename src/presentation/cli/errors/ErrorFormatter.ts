/**
 * Error Formatter
 *
 * Consistent error formatting across all output modes.
 * Extracts error message, stack trace, and optional error codes.
 */

export interface FormattedError {
  message: string;
  stack?: string;
  code?: string | number;
}

/**
 * Format an error for display
 */
export function formatError(error: Error | string | unknown): FormattedError {
  // String errors
  if (typeof error === "string") {
    return { message: error };
  }

  // Error objects
  if (error instanceof Error) {
    const formatted: FormattedError = {
      message: error.message,
    };

    if (error.stack) {
      formatted.stack = error.stack;
    }

    // Check for error codes (common in Node.js errors)
    if (
      "code" in error &&
      (typeof error.code === "string" || typeof error.code === "number")
    ) {
      formatted.code = error.code;
    }

    return formatted;
  }

  // Unknown error types
  return {
    message: String(error),
  };
}

/**
 * Check if an error is a "not found" type error
 */
export function isNotFoundError(error: Error | unknown): boolean {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return code === "ENOENT" || code === "NOT_FOUND";
  }
  return false;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: Error | unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === "ValidationError" ||
      error.message.toLowerCase().includes("invalid")
    );
  }
  return false;
}

/**
 * Check if an error is a permission/access error
 */
export function isPermissionError(error: Error | unknown): boolean {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return code === "EACCES" || code === "EPERM" || code === "FORBIDDEN";
  }
  return false;
}
