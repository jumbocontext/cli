import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";

type BannerProps = {
  readonly persist?: boolean;
};

type BillboardInput = {
  readonly height: number;
  readonly width: number;
  readonly onDone?: () => void;
};

const mockAnimatedBanner = jest.fn((props: BannerProps) =>
  React.createElement(
    Text,
    {},
    `MOCK_ANIMATED_BANNER ${props.persist ? "persist" : "erase"}`,
  ),
);
const mockBillboardTrigger = jest.fn((input: BillboardInput) =>
  React.createElement(
    Text,
    {},
    `MOCK_BILLBOARD ${input.width}x${input.height}`,
  ),
);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/animated-banner/Banner.js",
  () => ({
    AnimatedBanner: mockAnimatedBanner,
  }),
);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/billboard/AnimatedBillboard.js",
  () => ({
    default: {
      trigger: mockBillboardTrigger,
    },
  }),
);

const { CockpitScreen } = await import(
  "../../../../../src/presentation/tui/cockpit/CockpitScreen.js"
);

describe("CockpitScreen launch animation routing", () => {
  beforeEach(() => {
    mockAnimatedBanner.mockClear();
    mockBillboardTrigger.mockClear();
  });

  it.each(["uninitialized", "unprimed", "primed-empty"] as const)(
    "keeps AnimatedBanner for state=%s",
    (state) => {
      const { lastFrame, unmount } = render(
        <CockpitScreen state={state} terminalWidth={72} terminalHeight={18} />,
      );

      expect(lastFrame()).toContain("MOCK_ANIMATED_BANNER");
      expect(mockBillboardTrigger).not.toHaveBeenCalled();
      expect(mockAnimatedBanner.mock.calls[0]?.[0].persist).toBe(
        state !== "primed-empty",
      );
      unmount();
    },
  );

  it("uses AnimatedBillboard for the primed launchpad", () => {
    const { lastFrame, unmount } = render(
      <CockpitScreen state="primed" terminalWidth={72} terminalHeight={18} />,
    );

    expect(lastFrame()).toContain("MOCK_BILLBOARD 72x18");
    expect(mockAnimatedBanner).not.toHaveBeenCalled();
    expect(mockBillboardTrigger.mock.calls[0]?.[0]).toEqual({
      height: 18,
      width: 72,
      onDone: expect.any(Function),
    });
    unmount();
  });
});
