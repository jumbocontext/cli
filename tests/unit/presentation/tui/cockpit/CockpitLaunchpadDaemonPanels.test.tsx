import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { DEFAULT_WORKER_DAEMON_CONFIGS } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { CockpitLaunchpadDaemonPanels } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadDaemonPanels.js";
import { CockpitDaemonPanelCopy } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonPanelCopy.js";
import type { SubprocessSnapshot } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

const daemonFrameIndexByName = {
  refiner: 0,
  reviewer: 0,
  codifier: 0,
} as const;

function createSnapshot(
  name: SubprocessSnapshot["name"],
  status: SubprocessSnapshot["status"],
): SubprocessSnapshot {
  return {
    name,
    status,
    config: DEFAULT_WORKER_DAEMON_CONFIGS[name],
    stdout: [],
    stderr: [],
    events: [],
  };
}

describe("CockpitLaunchpadDaemonPanels", () => {
  it("renders daemon panels with selected, configuration, and info state", () => {
    const { lastFrame, unmount } = render(
      <CockpitLaunchpadDaemonPanels
        selectedDaemon="reviewer"
        configuredDaemon="reviewer"
        infoDaemon="reviewer"
        daemonStatuses={[
          createSnapshot("refiner", "stopped"),
          createSnapshot("reviewer", "running"),
          createSnapshot("codifier", "stopped"),
        ]}
        daemonConfigs={DEFAULT_WORKER_DAEMON_CONFIGS}
        daemonFrameIndexByName={daemonFrameIndexByName}
        refinerGlyphPalette={["#111111"]}
        reviewerGlyphPalette={["#222222"]}
        codifierGlyphColors={{ "█": "#333333", "░": "#444444" }}
      />,
    );

    expect(lastFrame()).toContain("REFINER//");
    expect(lastFrame()).toContain("REVIEWER//");
    expect(lastFrame()).toContain("CODIFIER//");
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.stop);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.infoOpen);
    unmount();
  });
});
