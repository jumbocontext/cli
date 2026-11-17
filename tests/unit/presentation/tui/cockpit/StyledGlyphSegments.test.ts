import { describe, expect, it } from "@jest/globals";
import { BaseColors } from "../../../../../src/presentation/shared/DesignTokens.js";
import { SubprocessStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";
import { getStyledGlyphSegments } from "../../../../../src/presentation/tui/cockpit/StyledGlyphSegments.js";

describe("getStyledGlyphSegments", () => {
  it("coalesces adjacent glyph text with the same running style", () => {
    const segments = getStyledGlyphSegments("██░X", {
      "█": "#111111",
      "░": "#222222",
    }, {
      status: SubprocessStatus.RUNNING,
      events: [],
    });

    expect(segments).toEqual([
      { text: "██", color: "#111111", dimColor: undefined },
      { text: "░", color: "#222222", dimColor: undefined },
      { text: "X", color: BaseColors.shade3, dimColor: false },
    ]);
  });

  it("dims all styled glyph text while the daemon is not running", () => {
    const segments = getStyledGlyphSegments("█░", {
      "█": "#111111",
      "░": "#222222",
    }, {
      status: SubprocessStatus.STOPPED,
      events: [],
    });

    expect(segments).toEqual([
      { text: "█░", color: BaseColors.shade6, dimColor: undefined },
    ]);
  });
});
