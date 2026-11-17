import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitDaemonPanelCopy } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonPanelCopy.js";
import { DaemonConfigWizard } from "../../../../../src/presentation/tui/cockpit/DaemonConfigWizard.js";
import type {
  DaemonConfig,
  SubprocessSnapshot,
} from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

const runningConfig: DaemonConfig = {
  agentId: "running-agent",
  pollIntervalMs: 30000,
  maxRetries: 3,
};

const pendingConfig: DaemonConfig = {
  agentId: "pending-agent",
  pollIntervalMs: 45000,
  maxRetries: 5,
};

function createSnapshot(
  status: SubprocessSnapshot["status"],
): SubprocessSnapshot {
  return {
    name: "refiner",
    status,
    config: runningConfig,
    stdout: [],
    stderr: [],
    events: [],
  };
}

describe("DaemonConfigWizard", () => {
  it("renders pending config for stopped daemons", () => {
    const { lastFrame, unmount } = render(
      <DaemonConfigWizard
        snapshot={createSnapshot("stopped")}
        pendingConfig={pendingConfig}
        selected={true}
      />,
    );

    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.pidLabel);
    expect(lastFrame()).toContain("-");
    expect(lastFrame()).toContain(pendingConfig.agentId);
    expect(lastFrame()).toContain("45s");
    expect(lastFrame()).toContain(String(pendingConfig.maxRetries));
    unmount();
  });

  it("renders active config and pid for running daemons", () => {
    const { lastFrame, unmount } = render(
      <DaemonConfigWizard
        snapshot={{ ...createSnapshot("running"), pid: 1234 }}
        pendingConfig={pendingConfig}
        selected={false}
      />,
    );

    expect(lastFrame()).toContain("1234");
    expect(lastFrame()).toContain(runningConfig.agentId);
    expect(lastFrame()).toContain("30s");
    expect(lastFrame()).toContain(String(runningConfig.maxRetries));
    expect(lastFrame()).not.toContain(pendingConfig.agentId);
    unmount();
  });
});
