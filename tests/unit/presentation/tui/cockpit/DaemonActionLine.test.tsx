import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitDaemonPanelCopy } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonPanelCopy.js";
import { DaemonActionLine } from "../../../../../src/presentation/tui/cockpit/DaemonActionLine.js";
import type {
  DaemonConfig,
  SubprocessSnapshot,
} from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

const daemonConfig: DaemonConfig = {
  agentId: "codex",
  pollIntervalMs: 30000,
  maxRetries: 3,
};

function createSnapshot(
  status: SubprocessSnapshot["status"],
): SubprocessSnapshot {
  return {
    name: "refiner",
    status,
    config: daemonConfig,
    stdout: [],
    stderr: [],
    events: [],
  };
}

describe("DaemonActionLine", () => {
  it("renders start and info controls for stopped daemons", () => {
    const { lastFrame, unmount } = render(
      <DaemonActionLine
        snapshot={createSnapshot("stopped")}
        selected={true}
        infoVisible={false}
      />,
    );

    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.start);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.config);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.info);
    unmount();
  });

  it("renders stop and info-close controls for running daemons", () => {
    const { lastFrame, unmount } = render(
      <DaemonActionLine
        snapshot={createSnapshot("running")}
        selected={false}
        infoVisible={true}
      />,
    );

    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.stop);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.config);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.infoOpen);
    unmount();
  });

  it("renders wait controls for stopping daemons", () => {
    const { lastFrame, unmount } = render(
      <DaemonActionLine
        snapshot={createSnapshot("stopping")}
        selected={false}
        infoVisible={false}
      />,
    );

    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.wait);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.config);
    unmount();
  });
});
