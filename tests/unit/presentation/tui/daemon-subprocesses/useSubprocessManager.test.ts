import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { SubprocessManagerProvider } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessManagerProvider.js";
import { useSubprocessManager } from "../../../../../src/presentation/tui/daemon-subprocesses/useSubprocessManager.js";
import type {
  ISubprocessManager,
  SubprocessSnapshot,
} from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

function createSnapshot(): SubprocessSnapshot {
  return {
    name: "refiner",
    status: "running",
    config: {
      agentId: "codex",
      pollIntervalMs: 30000,
      maxRetries: 3,
    },
    stdout: [],
    stderr: [],
    events: [],
  };
}

function createSubprocessManager(): ISubprocessManager {
  const snapshot = createSnapshot();

  return {
    spawn: async () => snapshot,
    terminate: async () => ({ ...snapshot, status: "stopped" }),
    terminateAll: async () => {},
    getStatus: () => snapshot,
    getAllStatuses: () => [snapshot],
  };
}

function HookProbe({
  onManager,
}: {
  readonly onManager: (manager: ISubprocessManager) => void;
}): React.ReactElement {
  onManager(useSubprocessManager());
  return React.createElement(Text, undefined, "hook observed");
}

describe("useSubprocessManager", () => {
  it("returns the manager supplied by SubprocessManagerProvider", () => {
    const manager = createSubprocessManager();
    let observedManager: ISubprocessManager | undefined;

    const { unmount } = render(
      React.createElement(
        SubprocessManagerProvider,
        { manager },
        React.createElement(HookProbe, {
          onManager: (value) => {
            observedManager = value;
          },
        }),
      ),
    );

    expect(observedManager).toBe(manager);
    unmount();
  });

  it("returns a no-op presentation fallback outside a provider", async () => {
    let observedManager: ISubprocessManager | undefined;

    const { unmount } = render(
      React.createElement(HookProbe, {
        onManager: (value) => {
          observedManager = value;
        },
      }),
    );

    expect(observedManager).toBeDefined();
    await expect(observedManager!.spawn("refiner")).resolves.toMatchObject({
      name: "refiner",
      status: "stopped",
    });
    expect(observedManager!.getAllStatuses()).toHaveLength(3);
    unmount();
  });
});
