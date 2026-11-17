import { describe, expect, it } from "@jest/globals";
import { getFrameCount } from "../../../../../src/presentation/cli/banner/AnimationFrames.js";
import { AnimatedBannerTiming } from "../../../../../src/presentation/tui/animated-banner/Timing.js";

describe("AnimatedBannerTiming", () => {
  it("derives frame boundaries from the shared banner animation frames", () => {
    expect(AnimatedBannerTiming.totalFrames).toBe(getFrameCount());
    expect(AnimatedBannerTiming.midpointFrame).toBe(
      Math.floor(getFrameCount() / 2),
    );
  });

  it("keeps the existing animation cadence values stable", () => {
    expect(AnimatedBannerTiming).toMatchObject({
      frameDurationMs: 9,
      tickMs: 4,
      holdDelayMs: 1120,
      eraseIntervalMs: 15,
    });
  });
});
