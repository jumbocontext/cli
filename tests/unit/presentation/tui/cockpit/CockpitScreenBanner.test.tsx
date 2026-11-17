import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";

type AnimatedBannerProps = {
  readonly animated?: boolean;
  readonly infoBoxLines?: string[];
  readonly persist?: boolean;
  readonly onComplete?: () => void;
};

const mockAnimatedBanner = jest.fn((props: AnimatedBannerProps) => (
  <Text>{`BANNER ${props.animated ? "animated" : "static"}`}</Text>
));

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/animated-banner/Banner.js",
  () => ({
    AnimatedBanner: mockAnimatedBanner,
  }),
);

const { CockpitScreenBanner } = await import(
  "../../../../../src/presentation/tui/cockpit/CockpitScreenBanner.js"
);

describe("CockpitScreenBanner", () => {
  beforeEach(() => {
    mockAnimatedBanner.mockClear();
  });

  it("renders the banner with animation and lifecycle info", () => {
    const onBannerAnimationComplete = jest.fn();
    const { lastFrame, unmount } = render(
      <CockpitScreenBanner
        state="uninitialized"
        shouldRenderBanner={true}
        bannerAnimationActive={true}
        bannerPersists={true}
        onBannerAnimationComplete={onBannerAnimationComplete}
      />,
    );

    expect(lastFrame()).toContain("BANNER animated");
    expect(mockAnimatedBanner.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        animated: true,
        persist: true,
        infoBoxLines: expect.any(Array),
        onComplete: onBannerAnimationComplete,
      }),
    );
    unmount();
  });

  it("does not render when banner routing is disabled", () => {
    const { lastFrame, unmount } = render(
      <CockpitScreenBanner
        state="primed"
        shouldRenderBanner={false}
        bannerAnimationActive={false}
        bannerPersists={false}
        onBannerAnimationComplete={jest.fn()}
      />,
    );

    expect(lastFrame() ?? "").toBe("");
    expect(mockAnimatedBanner).not.toHaveBeenCalled();
    unmount();
  });
});
