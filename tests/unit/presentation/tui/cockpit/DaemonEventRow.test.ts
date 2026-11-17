import { describe, expect, it } from "@jest/globals";
import type { DaemonEventRow } from "../../../../../src/presentation/tui/cockpit/DaemonEventRow.js";

describe("DaemonEventRow", () => {
  it("represents the display contract for a normalized daemon event row", () => {
    const row: DaemonEventRow = {
      key: "reviewer-0-processing-none-1000",
      source: "reviewer",
      category: "processing",
      timestampMs: 1000,
      message: "reviewing",
      color: "blue",
    };

    expect(Object.keys(row)).toEqual([
      "key",
      "source",
      "category",
      "timestampMs",
      "message",
      "color",
    ]);
  });
});
