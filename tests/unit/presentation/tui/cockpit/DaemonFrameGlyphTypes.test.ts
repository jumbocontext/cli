import { describe, expect, it } from "@jest/globals";
import type {
  DaemonFrameGlyphCell,
  DaemonFrameGlyphColorMap,
  DaemonFrameGlyphPalette,
  DaemonFrameGlyphStyle,
} from "../../../../../src/presentation/tui/cockpit/DaemonFrameGlyphTypes.js";

describe("DaemonFrameGlyphTypes", () => {
  it("supports typed glyph cells, palettes, color maps, and styles", () => {
    const cell: DaemonFrameGlyphCell = {
      glyph: "█",
      color: "#111111",
    };
    const palette: DaemonFrameGlyphPalette = [cell.color];
    const colorMap: DaemonFrameGlyphColorMap = {
      [cell.glyph]: palette[0],
    };
    const style: DaemonFrameGlyphStyle = {
      color: colorMap[cell.glyph],
      dimColor: false,
    };

    expect(style).toEqual({ color: "#111111", dimColor: false });
  });
});
