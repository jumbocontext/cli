import React from "react";
import { jest, describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadView.js";
import { StateReaderProvider } from "../../../../../src/presentation/tui/state-reading/StateReader.js";
import type { Settings } from "../../../../../src/application/settings/Settings.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
const waitForCondition = async (
  predicate: () => boolean,
  failureMessage: string,
) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await tick();
    if (predicate()) {
      return;
    }
  }
  throw new Error(failureMessage);
};
const defaultSettings: Settings = {
  qa: { defaultTurnLimit: 3 },
  claims: { claimDurationMinutes: 30 },
  telemetry: { enabled: true, anonymousId: null, consentGiven: false },
  tui: { showLaunchpadWelcome: true },
};

describe("CockpitLaunchpadView launchpad header", () => {
  it("removes the project panel from the primed launchpad", () => {
    const { lastFrame, unmount } = render(<CockpitLaunchpadView />);
    expect(lastFrame()).toBeDefined();
    expect(lastFrame()).not.toContain(process.cwd());
    unmount();
  });

  it("does not query project summary data for the primed launchpad", () => {
    const execute = jest.fn(async () => ({
      name: "Project Atlas",
      purpose: "Map context into the TUI",
      lifecycleState: "primed",
    }));
    const { unmount } = render(
      <StateReaderProvider
        controllers={{
          getProjectSummaryQueryHandler: {
            execute,
          },
        }}
        options={{ tickMs: 0 }}
      >
        <CockpitLaunchpadView />
      </StateReaderProvider>,
    );

    expect(execute).not.toHaveBeenCalled();
    unmount();
  });

  it("persists the launchpad welcome dismissal through settings", async () => {
    const settingsReader = {
      read: jest.fn(async () => defaultSettings),
      write: jest.fn(async (_settings: Settings) => {}),
    };
    const { stdin, unmount } = render(
      <CockpitLaunchpadView
        settingsReader={settingsReader}
        reviewerFrameDurationMs={0}
        refinerFrameDurationMs={0}
        codifierFrameDurationMs={0}
      />,
    );

    try {
      await waitForCondition(
        () => settingsReader.read.mock.calls.length > 0,
        "Timed out waiting for launchpad welcome preference read",
      );
      await tick();
      stdin.write("x");
      await waitForCondition(
        () => settingsReader.write.mock.calls.length > 0,
        "Timed out waiting for launchpad welcome dismissal write",
      );

      expect(settingsReader.write).toHaveBeenCalledWith({
        ...defaultSettings,
        tui: { showLaunchpadWelcome: false },
      });
    } finally {
      unmount();
    }
  });

  it("does not rewrite settings when the stored preference already hides the welcome panel", async () => {
    const settingsReader = {
      read: jest.fn(async () => ({
        ...defaultSettings,
        tui: { showLaunchpadWelcome: false },
      })),
      write: jest.fn(async (_settings: Settings) => {}),
    };
    const { stdin, unmount } = render(
      <CockpitLaunchpadView
        settingsReader={settingsReader}
        reviewerFrameDurationMs={0}
        refinerFrameDurationMs={0}
        codifierFrameDurationMs={0}
      />,
    );

    try {
      await tick();
      stdin.write("x");
      await tick();

      expect(settingsReader.write).not.toHaveBeenCalled();
    } finally {
      unmount();
    }
  });
});
