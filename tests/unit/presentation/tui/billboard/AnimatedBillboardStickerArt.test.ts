import { describe, expect, it } from "@jest/globals";
import { AnimatedBillboardStickerArt } from "../../../../../src/presentation/tui/billboard/AnimatedBillboardStickerArt.js";

describe("AnimatedBillboardStickerArt", () => {
  it("defines a non-empty fixed-width sticker glyph", () => {
    expect(AnimatedBillboardStickerArt.length).toBeGreaterThan(0);
    const width = AnimatedBillboardStickerArt[0]?.length ?? 0;
    expect(width).toBeGreaterThan(0);
    expect(AnimatedBillboardStickerArt.every((line) => line.length === width)).toBe(true);
  });
});
