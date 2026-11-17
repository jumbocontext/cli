import { describe, expect, it } from "@jest/globals";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { DaemonStatusFinder } from "../../../../../src/presentation/tui/cockpit/DaemonStatusFinder.js";
import type { SubprocessSnapshot } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

describe("DaemonStatusFinder", () => {
  it("returns the matching daemon snapshot", () => {
    const reviewer = snapshot("reviewer", "running");

    expect(DaemonStatusFinder.find([snapshot("refiner", "stopped"), reviewer], "reviewer")).toBe(reviewer);
  });

  it("returns a default stopped snapshot when the daemon has no status", () => {
    expect(DaemonStatusFinder.find([], "refiner")).toEqual({
      name: "refiner",
      status: "stopped",
      config: DEFAULT_WORKER_DAEMON_CONFIG,
      stdout: [],
      stderr: [],
      events: [],
    });
  });
});

function snapshot(
  name: "refiner" | "reviewer",
  status: "running" | "stopped",
): SubprocessSnapshot {
  return {
    name,
    status,
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr: [],
    events: [],
  };
}
