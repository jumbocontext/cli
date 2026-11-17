import { describe, expect, it } from "@jest/globals";
import { BaseColors } from "../../../../../src/presentation/shared/DesignTokens.js";
import { SubprocessStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";
import {
  CODIFIER_FRAME_COUNT,
  DAEMON_PANEL_CONTENT_WIDTH,
  DEFAULT_CODIFIER_FRAME_DURATION_MS,
  DEFAULT_CODIFIER_GLYPH_COLORS,
  DEFAULT_RANDOM_GLYPH_COLORS,
  DEFAULT_REFINER_FRAME_DURATION_MS,
  DEFAULT_REVIEWER_FRAME_DURATION_MS,
  REFINER_FRAME_COUNT,
  RENDERED_DAEMON_FRAME_HEIGHT,
  REVIEWER_FRAME_COUNT,
  getCodifierFrame,
  getGlyphCellLinePrefix,
  getGlyphCellLineSuffix,
  getGlyphCellSegments,
  getGlyphLinePrefix,
  getGlyphLineSuffix,
  getRefinerFrame,
  getRenderedDaemonFrame,
  getRenderedFrameIndex,
  getReviewerFrame,
  getStyledGlyphSegments,
  isDaemonStatusLine,
} from "../../../../../src/presentation/tui/cockpit/CockpitDaemonFrames.js";

describe("CockpitDaemonFrames", () => {
  it("preserves the legacy daemon frame constants contract", () => {
    expect(RENDERED_DAEMON_FRAME_HEIGHT).toBe(5);
    expect(DAEMON_PANEL_CONTENT_WIDTH).toBe(35);
    expect(REFINER_FRAME_COUNT).toBe(9);
    expect(REVIEWER_FRAME_COUNT).toBe(6);
    expect(CODIFIER_FRAME_COUNT).toBe(6);
    expect(DEFAULT_REFINER_FRAME_DURATION_MS).toBe(500);
    expect(DEFAULT_REVIEWER_FRAME_DURATION_MS).toBe(350);
    expect(DEFAULT_CODIFIER_FRAME_DURATION_MS).toBe(200);
    expect(DEFAULT_RANDOM_GLYPH_COLORS.length).toBeGreaterThan(0);
    expect(DEFAULT_CODIFIER_GLYPH_COLORS).toEqual({
      "█": BaseColors.shade1,
      "░": BaseColors.shade2,
    });
  });

  it("delegates rendered frame selection and index policies", () => {
    expect(getRenderedDaemonFrame([0, 1, 2, 3, 4, 5])).toEqual([
      0,
      1,
      2,
      3,
      4,
    ]);
    expect(getRenderedFrameIndex({
      status: SubprocessStatus.RUNNING,
      events: [],
    }, 2)).toBe(2);
    expect(getRenderedFrameIndex({
      status: SubprocessStatus.STOPPED,
      events: [],
    }, 2)).toBe(0);
  });

  it("delegates status overlay slicing for cell and text lines", () => {
    const cells = [
      { glyph: "a", color: "#1" },
      { glyph: "b", color: "#2" },
      { glyph: "c", color: "#3" },
      { glyph: "d", color: "#4" },
      { glyph: "e", color: "#5" },
    ] as const;

    expect(isDaemonStatusLine(2)).toBe(true);
    expect(getGlyphCellLinePrefix(cells, "RUN", 2)).toEqual(cells.slice(0, 1));
    expect(getGlyphCellLineSuffix(cells, "RUN", 2)).toEqual(cells.slice(4));
    expect(getGlyphLinePrefix("abcde", "RUN", 2)).toBe("a");
    expect(getGlyphLineSuffix("abcde", "RUN", 2)).toBe("e");
  });

  it("delegates deterministic frame factories", () => {
    expect(getCodifierFrame(0)).toEqual(getCodifierFrame(0));
    expect(getReviewerFrame(0, ["#111111"])[0]).toHaveLength(35);
    expect(getRefinerFrame(0, ["#111111"])[0][0].glyph).toBe("•");
  });

  it("delegates glyph segment rendering policies", () => {
    expect(getGlyphCellSegments([
      { glyph: "a", color: "#111111" },
      { glyph: "b", color: "#111111" },
    ], {
      status: SubprocessStatus.RUNNING,
      events: [],
    })).toEqual([{ text: "ab", color: "#111111" }]);
    expect(getStyledGlyphSegments("█", {
      "█": "#111111",
    }, {
      status: SubprocessStatus.RUNNING,
      events: [],
    })).toEqual([{ text: "█", color: "#111111", dimColor: undefined }]);
  });
});
