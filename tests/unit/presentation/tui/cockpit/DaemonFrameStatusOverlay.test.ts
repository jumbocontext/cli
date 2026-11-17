import { describe, expect, it } from "@jest/globals";
import { DaemonFrameStatusOverlay } from "../../../../../src/presentation/tui/cockpit/DaemonFrameStatusOverlay.js";

const glyphLine = [
  { glyph: "a", color: "#1" },
  { glyph: "b", color: "#2" },
  { glyph: "c", color: "#3" },
  { glyph: "d", color: "#4" },
  { glyph: "e", color: "#5" },
  { glyph: "f", color: "#6" },
  { glyph: "g", color: "#7" },
] as const;

describe("DaemonFrameStatusOverlay", () => {
  it("identifies the centered status overlay line", () => {
    expect(DaemonFrameStatusOverlay.isLine(2)).toBe(true);
    expect(DaemonFrameStatusOverlay.isLine(1)).toBe(false);
  });

  it("splits glyph cell lines around the centered status label", () => {
    expect(DaemonFrameStatusOverlay.getGlyphCellPrefix(glyphLine, "RUN", 2))
      .toEqual(
      glyphLine.slice(0, 2),
    );
    expect(DaemonFrameStatusOverlay.getGlyphCellSuffix(glyphLine, "RUN", 2))
      .toEqual(
      glyphLine.slice(5),
    );
  });

  it("keeps non-overlay glyph cell lines intact before the status label", () => {
    expect(DaemonFrameStatusOverlay.getGlyphCellPrefix(glyphLine, "RUN", 1))
      .toBe(
      glyphLine,
    );
    expect(DaemonFrameStatusOverlay.getGlyphCellSuffix(glyphLine, "RUN", 1))
      .toEqual([]);
  });

  it("splits text lines around the centered status label", () => {
    expect(DaemonFrameStatusOverlay.getGlyphTextPrefix("abcdefg", "RUN", 2))
      .toBe("ab");
    expect(DaemonFrameStatusOverlay.getGlyphTextSuffix("abcdefg", "RUN", 2))
      .toBe("fg");
  });
});
