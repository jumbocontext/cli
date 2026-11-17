/**
 * Logger interface for application-wide logging.
 *
 * Application layer interface that defines logging contract.
 * Infrastructure layer provides concrete implementations (file, console, etc.).
 */
export interface ILogger {
  /**
   * Log an error message
   */
  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>,
  ): void;

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Flush any buffered log entries (optional, for async loggers)
   */
  flush?(): Promise<void>;
}

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}
