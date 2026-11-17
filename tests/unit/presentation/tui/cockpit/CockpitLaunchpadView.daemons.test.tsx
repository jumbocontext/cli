import React from "react";
import { jest, describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadView.js";
import { SubprocessManagerProvider } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessManagerProvider.js";
import type { ISubprocessManager, DaemonConfig, DaemonName, SubprocessSnapshot } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
const waitForCondition = async (
  predicate: () => boolean,
  failureMessage: string,
) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await tick();
    if (predicate()) {
      return;
    }
  }
  throw new Error(failureMessage);
};
const defaultConfig = {
  agentId: "codex",
  pollIntervalMs: 30000,
  maxRetries: 3,
};

function createSnapshots(config: DaemonConfig = defaultConfig): Map<DaemonName, SubprocessSnapshot> {
  return new Map<DaemonName, SubprocessSnapshot>([
    ["reviewer", { name: "reviewer", status: "stopped", config, stdout: [], stderr: [], events: [] }],
    ["refiner", { name: "refiner", status: "stopped", config, stdout: [], stderr: [], events: [] }],
    ["codifier", { name: "codifier", status: "stopped", config, stdout: [], stderr: [], events: [] }],
  ]);
}

describe("CockpitLaunchpadView daemon controls", () => {
  it("starts and stops real daemon targets through ISubprocessManager without replacing launchpad panels", async () => {
    const snapshots = createSnapshots();
    const spawn = jest.fn(async (name: DaemonName, config = defaultConfig) => {
      const next = {
        name,
        status: "running" as const,
        config: { ...defaultConfig, ...config },
        pid: 123,
        stdout: [],
        stderr: [],
        events: [],
      };
      snapshots.set(name, next);
      return next;
    });
    const terminate = jest.fn(async (name: DaemonName) => {
      const next = { name, status: "stopped" as const, config: defaultConfig, stdout: ["stopped"], stderr: [], events: [] };
      snapshots.set(name, next);
      return next;
    });
    const manager: ISubprocessManager = {
      spawn,
      terminate,
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: DaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { stdin, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    try {
      stdin.write("s");
      await waitForCondition(
        () => spawn.mock.calls.some(([name]) => name === "refiner"),
        "Timed out waiting for refiner spawn",
      );
      expect(spawn).toHaveBeenCalledWith("refiner", defaultConfig);

      stdin.write("s");
      await waitForCondition(
        () => terminate.mock.calls.some(([name]) => name === "refiner"),
        "Timed out waiting for refiner terminate",
      );
      expect(terminate).toHaveBeenCalledWith("refiner");

      stdin.write("\t");
      await tick();
      stdin.write("s");
      await waitForCondition(
        () => spawn.mock.calls.some(([name]) => name === "reviewer"),
        "Timed out waiting for reviewer spawn",
      );
      expect(spawn).toHaveBeenCalledWith("reviewer", defaultConfig);

      stdin.write("\t");
      await tick();
      stdin.write("s");
      await waitForCondition(
        () => spawn.mock.calls.some(([name]) => name === "codifier"),
        "Timed out waiting for codifier spawn",
      );
      expect(spawn).toHaveBeenCalledWith("codifier", defaultConfig);
    } finally {
      unmount();
    }
  });

  it("cycles focused daemon panels with tab and toggles the focused daemon with s", async () => {
    const snapshots = createSnapshots();
    const spawn = jest.fn(async (name: DaemonName, config = defaultConfig) => {
      const next = { name, status: "running" as const, config: { ...defaultConfig, ...config }, pid: 123, stdout: [], stderr: [], events: [] };
      snapshots.set(name, next);
      return next;
    });
    const manager: ISubprocessManager = {
      spawn,
      terminate: jest.fn(async (name: DaemonName) => {
        const next = { name, status: "stopped" as const, config: defaultConfig, stdout: ["stopped"], stderr: [], events: [] };
        snapshots.set(name, next);
        return next;
      }),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: DaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { stdin, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    try {
      stdin.write("\t");
      await tick();

      stdin.write("s");
      await waitForCondition(
        () => spawn.mock.calls.some(([name]) => name === "reviewer"),
        "Timed out waiting for reviewer spawn",
      );
      expect(spawn).toHaveBeenCalledWith("reviewer", defaultConfig);

      stdin.write("\t");
      await tick();

      stdin.write("s");
      await waitForCondition(
        () => spawn.mock.calls.some(([name]) => name === "codifier"),
        "Timed out waiting for codifier spawn",
      );
      expect(spawn).toHaveBeenCalledWith("codifier", defaultConfig);
    } finally {
      unmount();
    }
  });

});
