import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitDaemonPanelCopy } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonPanelCopy.js";
import { DaemonInfoOverlay } from "../../../../../src/presentation/tui/cockpit/DaemonInfoOverlay.js";
import { RefinerDaemonConstants } from "../../../../../src/presentation/tui/cockpit/daemons/RefinerDaemonConstants.js";

describe("DaemonInfoOverlay", () => {
  it("renders daemon info and close affordance", () => {
    const { lastFrame, unmount } = render(
      <DaemonInfoOverlay daemonConstants={RefinerDaemonConstants} />,
    );

    expect(lastFrame()).toContain(RefinerDaemonConstants.info.title);
    expect(lastFrame()).toContain(RefinerDaemonConstants.info.lines[0]);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.closeInfoLabel);
    unmount();
  });
});
