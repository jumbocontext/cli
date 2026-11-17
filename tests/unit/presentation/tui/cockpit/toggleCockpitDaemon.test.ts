import { describe, expect, it, jest } from "@jest/globals";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { toggleCockpitDaemon } from "../../../../../src/presentation/tui/cockpit/toggleCockpitDaemon.js";
import type { DaemonEventRow } from "../../../../../src/presentation/tui/cockpit/DaemonEventRow.js";
import type {
  ISubprocessManager,
  DaemonName,
  SubprocessSnapshot,
} from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

function createSnapshot(
  status: SubprocessSnapshot["status"],
): SubprocessSnapshot {
  return {
    name: "refiner",
    status,
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr: [],
    events: [],
  };
}

function createManager(snapshot: SubprocessSnapshot): ISubprocessManager {
  return {
    spawn: jest.fn(async () => createSnapshot("running")),
    terminate: jest.fn(async () => createSnapshot("stopped")),
    terminateAll: jest.fn(async () => {}),
    getStatus: jest.fn((name: DaemonName) => ({ ...snapshot, name })),
    getAllStatuses: jest.fn(() => [snapshot]),
  };
}

describe("toggleCockpitDaemon", () => {
  it("spawns stopped daemons and refreshes status state", async () => {
    const manager = createManager(createSnapshot("stopped"));
    const setDaemonStatuses = jest.fn();
    const setDaemonEventRows = jest.fn();

    await toggleCockpitDaemon(
      "refiner",
      manager,
      DEFAULT_WORKER_DAEMON_CONFIG,
      setDaemonStatuses,
      setDaemonEventRows,
    );

    expect(manager.spawn).toHaveBeenCalledWith(
      "refiner",
      DEFAULT_WORKER_DAEMON_CONFIG,
    );
    expect(manager.terminate).not.toHaveBeenCalled();
    expect(setDaemonStatuses).toHaveBeenCalledWith([createSnapshot("stopped")]);
    expect(setDaemonEventRows).toHaveBeenCalledWith(expect.any(Function));
  });

  it("terminates running daemons and returns an event-row updater", async () => {
    const manager = createManager(createSnapshot("running"));
    const setDaemonStatuses = jest.fn();
    const setDaemonEventRows = jest.fn();

    await toggleCockpitDaemon(
      "refiner",
      manager,
      DEFAULT_WORKER_DAEMON_CONFIG,
      setDaemonStatuses,
      setDaemonEventRows,
    );

    const updateRows = setDaemonEventRows.mock.calls[0][0] as (
      currentRows: readonly DaemonEventRow[],
    ) => readonly DaemonEventRow[];

    expect(manager.terminate).toHaveBeenCalledWith("refiner");
    expect(updateRows([])).toEqual([
      expect.objectContaining({
        category: "starting",
        source: "refiner",
      }),
    ]);
  });

  it("does not spawn or terminate daemons that are already stopping", async () => {
    const manager = createManager(createSnapshot("stopping"));
    const setDaemonStatuses = jest.fn();
    const setDaemonEventRows = jest.fn();

    await toggleCockpitDaemon(
      "refiner",
      manager,
      DEFAULT_WORKER_DAEMON_CONFIG,
      setDaemonStatuses,
      setDaemonEventRows,
    );

    expect(manager.spawn).not.toHaveBeenCalled();
    expect(manager.terminate).not.toHaveBeenCalled();
    expect(setDaemonStatuses).toHaveBeenCalledWith([createSnapshot("stopping")]);
  });
});
