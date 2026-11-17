import { describe, expect, it } from "@jest/globals";
import { RandomGlyphFrameFactory } from "../../../../../src/presentation/tui/cockpit/RandomGlyphFrameFactory.js";

const glyphPalette = ["#111111", "#222222"] as const;

describe("RandomGlyphFrameFactory", () => {
  it("creates reviewer glyph frames with stable row and column dimensions", () => {
    const frame = RandomGlyphFrameFactory.getReviewerFrame(0, glyphPalette);

    expect(frame).toHaveLength(10);
    for (const line of frame) {
      expect(line).toHaveLength(35);
      for (const cell of line) {
        expect(cell.glyph.length).toBeGreaterThan(0);
        expect(glyphPalette).toContain(cell.color);
      }
    }
  });

  it("creates refiner glyph frames from the supplied palette", () => {
    const frame = RandomGlyphFrameFactory.getRefinerFrame(0, glyphPalette);

    expect(frame).toHaveLength(10);
    expect(frame[0]).toHaveLength(35);
    expect(frame[0][0].glyph).toBe("•");
    expect(glyphPalette).toContain(frame[0][0].color);
  });

  it("returns an error glyph frame for out-of-range indexes", () => {
    const frame = RandomGlyphFrameFactory.getReviewerFrame(
      RandomGlyphFrameFactory.reviewerFrameCount,
      glyphPalette,
    );

    expect(frame).toEqual([[expect.objectContaining({ glyph: "error" })]]);
  });

  it("is deterministic per frame index and varies across frames", () => {
    const firstFrame = RandomGlyphFrameFactory.getReviewerFrame(0, glyphPalette);
    const repeatedFrame = RandomGlyphFrameFactory.getReviewerFrame(
      0,
      glyphPalette,
    );
    const nextFrame = RandomGlyphFrameFactory.getReviewerFrame(1, glyphPalette);

    expect(repeatedFrame).toEqual(firstFrame);
    expect(nextFrame).not.toEqual(firstFrame);
  });

  it("exposes random glyph animation timing and default palette", () => {
    expect(RandomGlyphFrameFactory.refinerFrameCount).toBe(9);
    expect(RandomGlyphFrameFactory.reviewerFrameCount).toBe(6);
    expect(RandomGlyphFrameFactory.defaultRefinerFrameDurationMs).toBe(500);
    expect(RandomGlyphFrameFactory.defaultReviewerFrameDurationMs).toBe(350);
    expect(RandomGlyphFrameFactory.defaultGlyphColors.length).toBeGreaterThan(0);
  });
});
