import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { CockpitDaemonPanel } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonPanel.js";
import { CockpitDaemonPanelCopy } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonPanelCopy.js";
import { RefinerDaemonConstants } from "../../../../../src/presentation/tui/cockpit/daemons/RefinerDaemonConstants.js";
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

describe("CockpitDaemonPanel", () => {
  it("renders supplied daemon frame content and stopped action controls", () => {
    const { lastFrame, unmount } = render(
      <CockpitDaemonPanel
        daemonConstants={RefinerDaemonConstants}
        snapshot={createSnapshot("stopped")}
        pendingConfig={daemonConfig}
        selected={true}
        configuring={false}
        infoVisible={false}
      >
        <Text>daemon frame</Text>
      </CockpitDaemonPanel>,
    );

    expect(lastFrame()).toContain("daemon frame");
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.start);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.config);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.info);
    unmount();
  });

  it("renders running and configuration panel labels through cockpit constants", () => {
    const { lastFrame, unmount } = render(
      <CockpitDaemonPanel
        daemonConstants={RefinerDaemonConstants}
        snapshot={{ ...createSnapshot("running"), pid: 1234 }}
        pendingConfig={daemonConfig}
        selected={true}
        configuring={true}
        infoVisible={true}
      >
        <Text>daemon frame</Text>
      </CockpitDaemonPanel>,
    );

    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.stop);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.action.infoOpen);
    expect(lastFrame()).toContain(CockpitDaemonPanelCopy.pidLabel);
    unmount();
  });

  it("uses heartbeat elapsed time while retaining the latest meaningful activity", () => {
    const { lastFrame, unmount } = render(
      <CockpitDaemonPanel
        daemonConstants={RefinerDaemonConstants}
        snapshot={{
          ...createSnapshot("running"),
          events: [
            {
              daemon: "refiner",
              status: "working",
              category: "activity",
              goalId: "goal_heartbeat",
              phase: "agent",
              elapsedMs: 1_000,
              message: "inspecting goal",
            },
            {
              daemon: "refiner",
              status: "working",
              category: "heartbeat",
              goalId: "goal_heartbeat",
              elapsedMs: 6_000,
              message: "still working",
            },
          ],
        }}
        pendingConfig={daemonConfig}
        selected={true}
        configuring={false}
        infoVisible={false}
      >
        <Text>daemon frame</Text>
      </CockpitDaemonPanel>,
    );

    expect(lastFrame()).toContain("goal_hea");
    expect(lastFrame()).toContain("agent");
    expect(lastFrame()).toContain("6s");
    expect(lastFrame()).toContain("inspecting goal");
    expect(lastFrame()).not.toContain("still working");
    unmount();
  });
});
