import { describe, expect, it } from "@jest/globals";
import { DaemonEventRowFormatter } from "../../../../../src/presentation/tui/cockpit/DaemonEventRowFormatter.js";

describe("DaemonEventRowFormatter", () => {
  it("formats timestamp, source, category, and message into a display row", () => {
    const formatted = DaemonEventRowFormatter.format({
      key: "key",
      source: "agent",
      category: "retry",
      timestampMs: 1767272400000,
      message: "review failed",
      color: "blue",
    });

    expect(formatted).toContain("agent");
    expect(formatted).toContain("retry");
    expect(formatted).toContain("review failed");
  });

  it("omits the message gap when the row has no message", () => {
    const formatted = DaemonEventRowFormatter.format({
      key: "key",
      source: "agent",
      category: "retry",
      timestampMs: 1767272400000,
      message: "",
      color: "blue",
    });

    expect(formatted.endsWith("retry       ")).toBe(true);
  });
});
