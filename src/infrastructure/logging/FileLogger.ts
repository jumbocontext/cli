import fs from "fs-extra";
import * as path from "path";
import { ILogger, LogLevel } from "../../application/logging/ILogger.js";

/**
 * File-based logger implementation.
 *
 * Writes log entries to a file with timestamps and context.
 * Handles log rotation and ensures directory exists.
 */
export class FileLogger implements ILogger {
  private readonly logFilePath: string;
  private writeStream: fs.WriteStream | null = null;

  /**
   * @param logDir - Absolute path to the log directory
   * @param minLevel - Minimum log level to write (default: INFO)
   */
  constructor(
    logDir: string,
    private readonly minLevel: LogLevel = LogLevel.INFO,
  ) {
    this.logFilePath = path.join(
      logDir,
      FileLogger.buildDailyLogFileName(new Date()),
    );
  }

  static buildDailyLogFileName(date: Date): string {
    const yyyy = date.getFullYear().toString();
    const dd = date.getDate().toString().padStart(2, "0");
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${yyyy}${mm}${dd}.log`;
  }

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>,
  ): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatEntry(LogLevel.ERROR, message, context);

      // Add error details if provided
      if (error) {
        const errorDetails =
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : { value: String(error) };
        this.writeEntry(
          entry + "\n" + JSON.stringify({ error: errorDetails }, null, 2),
        );
      } else {
        this.writeEntry(entry);
      }
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeEntry(this.formatEntry(LogLevel.WARN, message, context));
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeEntry(this.formatEntry(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeEntry(this.formatEntry(LogLevel.DEBUG, message, context));
    }
  }

  async flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.writeStream) {
        this.writeStream.end(() => {
          this.writeStream = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Ensures the log directory exists
   */
  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logFilePath);
    fs.ensureDirSync(dir);
  }

  /**
   * Initialize the write stream
   */
  private initializeStream(): void {
    this.writeStream = fs.createWriteStream(this.logFilePath, {
      flags: "a", // append mode
      encoding: "utf8",
    });

    this.writeStream.on("error", (err) => {
      console.error("[FileLogger] Failed to write to log file:", err);
    });
  }

  /**
   * Check if a log level should be written
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
    ];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex <= minIndex;
  }

  /**
   * Format a log entry with timestamp, level, message, and context
   */
  private formatEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? " " + JSON.stringify(context) : "";
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  /**
   * Write an entry to the log file
   */
  private writeEntry(entry: string): void {
    if (!this.writeStream) {
      this.ensureLogDirectory();
      this.initializeStream();
    }

    if (this.writeStream) {
      this.writeStream.write(entry + "\n");
    }
  }

  /**
   * Close the logger and flush pending writes
   */
  async close(): Promise<void> {
    await this.flush();
  }
}
