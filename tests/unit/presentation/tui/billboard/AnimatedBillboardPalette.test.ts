import { describe, expect, it } from "@jest/globals";
import { AnimatedBillboardPalette } from "../../../../../src/presentation/tui/billboard/AnimatedBillboardPalette.js";

describe("AnimatedBillboardPalette", () => {
  it("defines named fill and border colors for every billboard sticker pair", () => {
    expect(AnimatedBillboardPalette.length).toBeGreaterThan(0);
    expect(new Set(AnimatedBillboardPalette.map((pair) => pair.name)).size).toBe(
      AnimatedBillboardPalette.length,
    );

    for (const pair of AnimatedBillboardPalette) {
      expect(pair.fill).toMatch(/^#[0-9a-f]{6}$/i);
      expect(pair.border).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
