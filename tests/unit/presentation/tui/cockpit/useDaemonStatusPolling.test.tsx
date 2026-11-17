import React from "react";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { act } from "react";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { useDaemonStatusPolling } from "../../../../../src/presentation/tui/cockpit/useDaemonStatusPolling.js";
import type {
  ISubprocessManager,
  DaemonName,
  SubprocessSnapshot,
} from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

function createSnapshot(
  status: SubprocessSnapshot["status"],
  events: SubprocessSnapshot["events"] = [],
): SubprocessSnapshot {
  return {
    name: "reviewer",
    status,
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr: [],
    events,
  };
}

function PollingHarness({
  manager,
}: {
  readonly manager: ISubprocessManager;
}): React.ReactElement {
  const { daemonStatuses, daemonEventRows } = useDaemonStatusPolling(manager);

  return (
    <Text>
      {daemonStatuses[0]?.status}:{daemonEventRows.length}
    </Text>
  );
}

describe("useDaemonStatusPolling", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("polls subprocess statuses and appends daemon event rows", () => {
    jest.useFakeTimers();
    let snapshots: readonly SubprocessSnapshot[] = [
      createSnapshot("stopped"),
    ];
    const manager: ISubprocessManager = {
      spawn: jest.fn(async () => createSnapshot("running")),
      terminate: jest.fn(async () => createSnapshot("stopped")),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: DaemonName) => ({
        ...createSnapshot("stopped"),
        name,
      })),
      getAllStatuses: jest.fn(() => snapshots),
    };
    const { lastFrame, unmount } = render(<PollingHarness manager={manager} />);

    expect(lastFrame()).toContain("stopped:0");

    snapshots = [
      createSnapshot("running", [
        {
          daemon: "reviewer",
          status: "processing",
          message: "reviewing",
          timestampMs: 1767272400000,
        },
      ]),
    ];
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(lastFrame()).toContain("running:1");
    unmount();
  });
});
