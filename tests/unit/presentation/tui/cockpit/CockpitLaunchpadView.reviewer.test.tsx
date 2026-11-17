import { describe, expect, it } from "@jest/globals";
import {
  getReviewerFrame,
} from "../../../../../src/presentation/tui/cockpit/CockpitDaemonFrames.js";

const glyphPalette = ["#111111", "#222222"] as const;

describe("getReviewerFrame", () => {
  it("renders 10 rows of 35 styled glyph cells", () => {
    const frame = getReviewerFrame(0, glyphPalette);

    expect(frame).toHaveLength(10);
    for (const line of frame) {
      expect(line).toHaveLength(35);
      for (const cell of line) {
        expect(cell.glyph.length).toBeGreaterThan(0);
        expect(glyphPalette).toContain(cell.color);
      }
    }
  });

  it("falls back to a styled frame for invalid frame indexes", () => {
    const frame = getReviewerFrame(-1, glyphPalette);

    expect(frame).toHaveLength(1);
    expect(frame[0]).toHaveLength(1);
    expect(frame[0][0].glyph.length).toBeGreaterThan(0);
    expect(frame[0][0].color.length).toBeGreaterThan(0);
  });

  it("is deterministic per frame index and varies across frames", () => {
    const firstFrame = getReviewerFrame(0, glyphPalette);
    const repeatedFrame = getReviewerFrame(0, glyphPalette);
    const nextFrame = getReviewerFrame(1, glyphPalette);

    expect(repeatedFrame).toEqual(firstFrame);
    expect(nextFrame).not.toEqual(firstFrame);
  });
});
