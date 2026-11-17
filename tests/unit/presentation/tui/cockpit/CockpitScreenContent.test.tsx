import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";

const mockGreeterView = jest.fn(() => <Text>GREETER_VIEW</Text>);
const mockUnprimedView = jest.fn(() => <Text>UNPRIMED_VIEW</Text>);
const mockPrimedEmptyView = jest.fn(() => <Text>PRIMED_EMPTY_VIEW</Text>);
const mockLaunchpadView = jest.fn(() => <Text>LAUNCHPAD_VIEW</Text>);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/cockpit/CockpitGreeterView.js",
  () => ({
    CockpitGreeterView: mockGreeterView,
  }),
);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/cockpit/CockpitUnprimedView.js",
  () => ({
    CockpitUnprimedView: mockUnprimedView,
  }),
);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/cockpit/CockpitPrimedEmptyView.js",
  () => ({
    CockpitPrimedEmptyView: mockPrimedEmptyView,
  }),
);

jest.unstable_mockModule(
  "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadView.js",
  () => ({
    CockpitLaunchpadView: mockLaunchpadView,
  }),
);

const { CockpitScreenContent } = await import(
  "../../../../../src/presentation/tui/cockpit/CockpitScreenContent.js"
);

describe("CockpitScreenContent", () => {
  beforeEach(() => {
    mockGreeterView.mockClear();
    mockUnprimedView.mockClear();
    mockPrimedEmptyView.mockClear();
    mockLaunchpadView.mockClear();
  });

  it.each([
    ["uninitialized", "GREETER_VIEW", mockGreeterView],
    ["unprimed", "UNPRIMED_VIEW", mockUnprimedView],
    ["primed-empty", "PRIMED_EMPTY_VIEW", mockPrimedEmptyView],
  ] as const)("renders the lifecycle content for state=%s", (state, marker, view) => {
    const { lastFrame, unmount } = render(
      <CockpitScreenContent
        state={state}
        shortcutsEnabled={true}
        shouldRenderContent={true}
      />,
    );

    expect(lastFrame()).toContain(marker);
    expect(view).toHaveBeenCalledTimes(1);
    expect(mockLaunchpadView).not.toHaveBeenCalled();
    unmount();
  });

  it("passes launchpad rendering inputs for the primed state", () => {
    const launchAnimationRenderer = jest.fn(() => <Text>ANIMATION</Text>);
    const onBillboardAnimationComplete = jest.fn();
    const settingsReader = { read: jest.fn(), write: jest.fn() };
    const launchAnimationSize = { height: 24, width: 90 };
    const { lastFrame, unmount } = render(
      <CockpitScreenContent
        state="primed"
        shortcutsEnabled={false}
        shouldRenderContent={true}
        launchAnimationSize={launchAnimationSize}
        onBillboardAnimationComplete={onBillboardAnimationComplete}
        launchAnimationRenderer={launchAnimationRenderer}
        settingsReader={settingsReader}
      />,
    );

    expect(lastFrame()).toContain("LAUNCHPAD_VIEW");
    expect(mockLaunchpadView.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        shortcutsEnabled: false,
        launchAnimationSize,
        onLaunchAnimationDone: onBillboardAnimationComplete,
        launchAnimationRenderer,
        settingsReader,
      }),
    );
    unmount();
  });

  it("does not render content when content routing is disabled", () => {
    const { lastFrame, unmount } = render(
      <CockpitScreenContent
        state="primed"
        shortcutsEnabled={true}
        shouldRenderContent={false}
      />,
    );

    expect(lastFrame() ?? "").toBe("");
    expect(mockLaunchpadView).not.toHaveBeenCalled();
    unmount();
  });
});
