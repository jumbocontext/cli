/**
 * NDJSON (Newline-Delimited JSON) Format Renderer
 *
 * Streaming-friendly output for agents processing multiple events.
 * Each call produces one line of JSON.
 */

import { IFormatRenderer, RenderData } from "../types.js";

export class NdjsonRenderer implements IFormatRenderer {
  success(message: string, data?: RenderData): void {
    const output = data
      ? { type: "success", ...data }
      : { type: "success", message };
    this.writeLine(output);
  }

  error(message: string, err?: Error | string): void {
    const errorObj: RenderData = { type: "error", error: message };

    if (err) {
      if (typeof err === "string") {
        errorObj.details = err;
      } else {
        errorObj.details = err.message;
        if (err.stack) {
          errorObj.stack = err.stack;
        }
      }
    }

    this.writeLine(errorObj, true);
  }

  info(message: string, data?: RenderData): void {
    const output = data
      ? { type: "info", message, ...data }
      : { type: "info", message };
    this.writeLine(output);
  }

  data(data: RenderData): void {
    const output = { type: "data", ...data };
    this.writeLine(output);
  }

  section(title: string): void {
    // Sections can be represented as events in NDJSON
    this.writeLine({ type: "section", title });
  }

  headline(title: string): void {
    // Headlines can be represented as events in NDJSON
    this.writeLine({ type: "headline", title });
  }

  banner(_lines: string[]): void {
    // Banners are not relevant in NDJSON output; ignored
  }

  divider(): void {
    // Dividers are not relevant in NDJSON output; ignored
  }

  /**
   * Write a single line of JSON
   */
  private writeLine(data: RenderData, isError = false): void {
    const json = JSON.stringify(data);

    if (isError) {
      console.error(json);
    } else {
      console.log(json);
    }
  }
}
