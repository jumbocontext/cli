import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadCopy } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadCopy.js";
import { CockpitLaunchpadEventLog } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadEventLog.js";
import type { DaemonEventRow } from "../../../../../src/presentation/tui/cockpit/DaemonEventRow.js";

describe("CockpitLaunchpadEventLog", () => {
  it("renders the events heading and formatted daemon rows", () => {
    const rows: readonly DaemonEventRow[] = [
      {
        key: "reviewer:1",
        daemon: "reviewer",
        category: "status",
        message: "review queued",
        source: "daemon",
        timestampMs: 1767272400000,
        color: "#ffffff",
      },
    ];
    const { lastFrame, unmount } = render(<CockpitLaunchpadEventLog rows={rows} />);

    expect(lastFrame()).toContain(CockpitLaunchpadCopy.eventsHeading);
    expect(lastFrame()).toContain("review queued");
    unmount();
  });
});
