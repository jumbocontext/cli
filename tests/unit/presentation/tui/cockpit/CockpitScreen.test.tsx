import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { Box } from "ink";
import { CockpitScreen } from "../../../../../src/presentation/tui/cockpit/CockpitScreen.js";
import { CockpitUnprimedCopy } from "../../../../../src/presentation/tui/cockpit/CockpitUnprimedCopy.js";
import { CockpitUnprimedView } from "../../../../../src/presentation/tui/cockpit/CockpitUnprimedView.js";

describe("CockpitScreen", () => {
  it.each(["uninitialized", "unprimed", "primed-empty", "primed"] as const)(
    "renders without crashing for state=%s",
    (state) => {
      const { lastFrame, unmount } = render(<CockpitScreen state={state} />);
      expect((lastFrame() ?? "").length).toBeGreaterThan(0);
      unmount();
    },
  );

  it("renders without crashing when state is omitted", () => {
    const { lastFrame, unmount } = render(<CockpitScreen />);
    expect((lastFrame() ?? "").length).toBeGreaterThan(0);
    unmount();
  });

  it("renders a local skip affordance on the unprimed view", () => {
    const { lastFrame, unmount } = render(<CockpitUnprimedView />);
    expect(lastFrame()).toContain(CockpitUnprimedCopy.skipPrompt.suffix.trim());
    unmount();
  });

  it("does not trigger the primed launch animation when the billboard animation is complete", () => {
    const launchAnimationRenderer = jest.fn(() => <Box />);
    const { unmount } = render(
      <CockpitScreen
        state="primed"
        launchAnimationEnabled={true}
        billboardAnimationComplete={true}
        launchAnimationRenderer={launchAnimationRenderer}
      />,
    );

    expect(launchAnimationRenderer).not.toHaveBeenCalled();
    unmount();
  });

  it("triggers the primed launch animation while the billboard animation is incomplete", () => {
    const launchAnimationRenderer = jest.fn(() => <Box />);
    const { unmount } = render(
      <CockpitScreen
        state="primed"
        launchAnimationEnabled={true}
        billboardAnimationComplete={false}
        terminalWidth={100}
        terminalHeight={30}
        launchAnimationRenderer={launchAnimationRenderer}
      />,
    );

    expect(launchAnimationRenderer).toHaveBeenCalledTimes(1);
    expect(launchAnimationRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        height: 30,
        width: 100,
        onDone: expect.any(Function),
      }),
    );
    unmount();
  });

  it("does not trigger the primed launch animation when launch animation is disabled", () => {
    const launchAnimationRenderer = jest.fn(() => <Box />);
    const { unmount } = render(
      <CockpitScreen
        state="primed"
        launchAnimationEnabled={false}
        launchAnimationRenderer={launchAnimationRenderer}
      />,
    );

    expect(launchAnimationRenderer).not.toHaveBeenCalled();
    unmount();
  });

  it("fires the banner completion callback immediately when the unprimed banner animation is complete", () => {
    const onBannerAnimationComplete = jest.fn();
    const { unmount } = render(
      <CockpitScreen
        state="unprimed"
        launchAnimationEnabled={true}
        bannerAnimationComplete={true}
        onBannerAnimationComplete={onBannerAnimationComplete}
      />,
    );

    expect(onBannerAnimationComplete).toHaveBeenCalledTimes(1);
    unmount();
  });
});
