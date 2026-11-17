import { describe, expect, it } from "@jest/globals";
import { BaseColors } from "../../../../../src/presentation/shared/DesignTokens.js";
import { CodifierFrameFactory } from "../../../../../src/presentation/tui/cockpit/CodifierFrameFactory.js";

describe("CodifierFrameFactory", () => {
  it("creates codifier frames with stable row and column dimensions", () => {
    const frame = CodifierFrameFactory.getFrame(0);

    expect(frame).toHaveLength(10);
    for (const line of frame) {
      expect(line).toHaveLength(35);
    }
  });

  it("is deterministic per frame index and varies across frames", () => {
    const firstFrame = CodifierFrameFactory.getFrame(0);
    const repeatedFrame = CodifierFrameFactory.getFrame(0);
    const nextFrame = CodifierFrameFactory.getFrame(1);

    expect(repeatedFrame).toEqual(firstFrame);
    expect(nextFrame).not.toEqual(firstFrame);
  });

  it("returns an error frame for out-of-range indexes", () => {
    expect(CodifierFrameFactory.getFrame(-1)).toEqual(["error"]);
    expect(CodifierFrameFactory.getFrame(CodifierFrameFactory.frameCount))
      .toEqual(["error"]);
  });

  it("exposes codifier frame timing and default glyph colors", () => {
    expect(CodifierFrameFactory.defaultFrameDurationMs).toBe(200);
    expect(CodifierFrameFactory.defaultGlyphColors).toEqual({
      "█": BaseColors.shade1,
      "░": BaseColors.shade2,
    });
  });
});
