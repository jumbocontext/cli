import { describe, expect, it } from "@jest/globals";
import { getAnimatedBannerColorGradientHex } from "../../../../../src/presentation/tui/animated-banner/ColorGradient.js";

describe("getAnimatedBannerColorGradientHex", () => {
  it("returns a valid hex color string for any progress value", () => {
    expect(getAnimatedBannerColorGradientHex(0)).toMatch(/^#[0-9a-f]{6}$/);
    expect(getAnimatedBannerColorGradientHex(0.5)).toMatch(/^#[0-9a-f]{6}$/);
    expect(getAnimatedBannerColorGradientHex(1)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("clamps progress below 0 to the start color", () => {
    expect(getAnimatedBannerColorGradientHex(-1)).toBe(
      getAnimatedBannerColorGradientHex(0),
    );
  });

  it("clamps progress above 1 to the end color", () => {
    expect(getAnimatedBannerColorGradientHex(2)).toBe(
      getAnimatedBannerColorGradientHex(1),
    );
  });

  it("produces different colors at different progress values", () => {
    const atQuarter = getAnimatedBannerColorGradientHex(0.25);
    const atHalf = getAnimatedBannerColorGradientHex(0.5);
    const atThreeQuarters = getAnimatedBannerColorGradientHex(0.75);

    expect(atQuarter).not.toBe(atHalf);
    expect(atHalf).not.toBe(atThreeQuarters);
  });
});
