/**
 * Text Format Renderer
 *
 * Human-friendly, colorful output for TTY.
 * Respects verbosity levels: quiet, normal, verbose.
 */

import { IFormatRenderer, RenderData, VerbosityLevel } from "../types.js";
import { Colors, Symbols, Templates, Layout } from "../StyleConfig.js";

export class TextRenderer implements IFormatRenderer {
  constructor(private verbosity: VerbosityLevel = "normal") {}

  success(message: string, data?: RenderData): void {
    if (this.verbosity === "quiet") {
      // Quiet mode: single line, no emoji
      console.log(message);
      return;
    }

    // Normal/verbose: friendly output
    console.log(Templates.successMessage(message));

    if (data && this.verbosity === "verbose") {
      this.renderData(data, 1);
    } else if (data) {
      // Normal mode: show data concisely
      this.renderDataConcise(data, 1);
    }
  }

  error(message: string, err?: Error | string): void {
    const errorDetails = err
      ? typeof err === "string"
        ? err
        : err.message
      : undefined;

    console.error(Templates.errorMessage(message, errorDetails));

    // In verbose mode, show stack trace
    if (this.verbosity === "verbose" && err instanceof Error && err.stack) {
      console.error(Colors.dim("\nStack trace:"));
      console.error(Colors.dim(err.stack));
    }
  }

  info(message: string, data?: RenderData): void {
    if (this.verbosity === "quiet") {
      return; // Suppress info in quiet mode
    }

    //console.log(`${Symbols.info} ${Colors.info(message)}`);
    console.log(`${Colors.info(message)}`);

    if (data && this.verbosity === "verbose") {
      this.renderData(data, 1);
    }
  }

  data(data: RenderData): void {
    if (this.verbosity === "quiet") {
      // Quiet mode: minimal output
      const values = Object.values(data);
      console.log(values.join(" "));
      return;
    }

    if (this.verbosity === "verbose") {
      this.renderData(data, 0);
    } else {
      this.renderDataConcise(data, 0);
    }
  }

  section(title: string): void {
    if (this.verbosity === "quiet") {
      return; // No sections in quiet mode
    }

    console.log(Templates.sectionHeader(`${Colors.info(title)}`));
  }

  headline(title: string): void {
    console.log(Templates.sectionHeader(`${Colors.headline(title)}`));
  }

  banner(lines: string[]): void {
    if (this.verbosity === "quiet") {
      return; // No banner in quiet mode
    }

    // Banner is always shown in normal/verbose mode
    lines.forEach((line) => console.log(line));
  }

  divider(): void {
    if (this.verbosity === "quiet") {
      return; // No divider in quiet mode
    }

    const width = Math.max(
      1,
      typeof process.stdout.columns === "number" && process.stdout.columns > 0
        ? process.stdout.columns
        : Layout.maxWidth,
    );
    console.log("\n");
    console.log(Colors.dim("─".repeat(width)));
    console.log("\n");
  }

  /**
   * Render data object in verbose format (multi-line, detailed)
   */
  private renderData(data: RenderData, indentLevel: number): void {
    for (const [key, value] of Object.entries(data)) {
      console.log(
        Templates.keyValue(key, this.formatValue(value), indentLevel),
      );
    }
  }

  /**
   * Render data object in concise format (single or few lines)
   */
  private renderDataConcise(data: RenderData, indentLevel: number): void {
    const entries = Object.entries(data);

    // If just 1-2 keys, show inline
    if (entries.length <= 2) {
      const formatted = entries
        .map(
          ([key, value]) =>
            `${Colors.accent(key + ":")} ${this.formatValue(value)}`,
        )
        .join(" ");
      console.log(Layout.indent.repeat(indentLevel) + formatted);
      return;
    }

    // Otherwise show each on its own line
    this.renderData(data, indentLevel);
  }

  /**
   * Format a value for display
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return Colors.dim("(none)");
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return Colors.dim("[]");
      if (value.length <= 3) {
        return value.map((v) => this.formatValue(v)).join(", ");
      }
      return `${value.length} items`;
    }

    if (typeof value === "object") {
      return Colors.dim(JSON.stringify(value, null, 2));
    }

    return String(value);
  }
}
