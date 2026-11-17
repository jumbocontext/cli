import { describe, expect, it } from "@jest/globals";
import { BaseColors } from "../../../../../src/presentation/shared/DesignTokens.js";
import { SubprocessStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";
import { getGlyphCellSegments } from "../../../../../src/presentation/tui/cockpit/GlyphCellSegments.js";

describe("getGlyphCellSegments", () => {
  it("coalesces adjacent glyph cells with the same running color", () => {
    const segments = getGlyphCellSegments([
      { glyph: "a", color: "#111111" },
      { glyph: "b", color: "#111111" },
      { glyph: "c", color: "#222222" },
    ], {
      status: SubprocessStatus.RUNNING,
      events: [],
    });

    expect(segments).toEqual([
      { text: "ab", color: "#111111" },
      { text: "c", color: "#222222" },
    ]);
  });

  it("dims all glyph cell segments while the daemon is not running", () => {
    const segments = getGlyphCellSegments([
      { glyph: "a", color: "#111111" },
      { glyph: "b", color: "#222222" },
    ], {
      status: SubprocessStatus.STOPPED,
      events: [],
    });

    expect(segments).toEqual([
      { text: "ab", color: BaseColors.shade6 },
    ]);
  });
});
