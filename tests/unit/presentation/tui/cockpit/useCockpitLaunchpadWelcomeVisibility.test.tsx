import React, { useEffect } from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import type { Settings } from "../../../../../src/application/settings/Settings.js";
import { useCockpitLaunchpadWelcomeVisibility } from "../../../../../src/presentation/tui/cockpit/useCockpitLaunchpadWelcomeVisibility.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const defaultSettings: Settings = {
  qa: { defaultTurnLimit: 3 },
  claims: { claimDurationMinutes: 30 },
  telemetry: { enabled: true, anonymousId: null, consentGiven: false },
  tui: { showLaunchpadWelcome: true },
};

function WelcomeVisibilityHarness({
  settingsReader,
  dismiss = false,
}: {
  readonly settingsReader?: {
    readonly read: () => Promise<Settings>;
    readonly write: (settings: Settings) => Promise<void>;
  };
  readonly dismiss?: boolean;
}): React.ReactElement {
  const { welcomeVisible, hideWelcome } =
    useCockpitLaunchpadWelcomeVisibility(settingsReader);

  useEffect(() => {
    if (dismiss) {
      void hideWelcome();
    }
  }, [dismiss, hideWelcome]);

  return <Text>{welcomeVisible === undefined ? "loading" : String(welcomeVisible)}</Text>;
}

describe("useCockpitLaunchpadWelcomeVisibility", () => {
  it("loads the stored welcome visibility and persists dismissal", async () => {
    const settingsReader = {
      read: jest.fn(async () => defaultSettings),
      write: jest.fn(async (_settings: Settings) => {}),
    };
    const { lastFrame, rerender, unmount } = render(
      <WelcomeVisibilityHarness settingsReader={settingsReader} />,
    );

    expect(lastFrame()).toContain("loading");
    await tick();
    expect(lastFrame()).toContain("true");

    rerender(
      <WelcomeVisibilityHarness settingsReader={settingsReader} dismiss={true} />,
    );
    await tick();

    expect(lastFrame()).toContain("false");
    expect(settingsReader.write).toHaveBeenCalledWith({
      ...defaultSettings,
      tui: { showLaunchpadWelcome: false },
    });
    unmount();
  });

  it("falls back to visible when settings cannot be read", async () => {
    const settingsReader = {
      read: jest.fn(async () => {
        throw new Error("unavailable");
      }),
      write: jest.fn(async (_settings: Settings) => {}),
    };
    const { lastFrame, unmount } = render(
      <WelcomeVisibilityHarness settingsReader={settingsReader} />,
    );

    await tick();

    expect(lastFrame()).toContain("true");
    unmount();
  });
});
