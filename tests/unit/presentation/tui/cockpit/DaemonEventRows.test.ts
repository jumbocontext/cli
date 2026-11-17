import { describe, expect, it } from "@jest/globals";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { DaemonEventRows } from "../../../../../src/presentation/tui/cockpit/DaemonEventRows.js";
import type { SubprocessSnapshot } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

describe("DaemonEventRows", () => {
  it("normalizes snapshots into newest-first bounded rows", () => {
    const rows = DaemonEventRows.fromSnapshots([
      snapshot("old", 1000),
      snapshot("new", 2000),
      snapshot("extra-1", 3000),
      snapshot("extra-2", 4000),
      snapshot("extra-3", 5000),
      snapshot("extra-4", 6000),
      snapshot("extra-5", 7000),
      snapshot("extra-6", 8000),
      snapshot("extra-7", 9000),
      snapshot("extra-8", 10000),
      snapshot("extra-9", 11000),
    ], 12000);

    expect(rows).toHaveLength(10);
    expect(rows.map((row) => row.message)).toEqual([
      "extra-9",
      "extra-8",
      "extra-7",
      "extra-6",
      "extra-5",
      "extra-4",
      "extra-3",
      "extra-2",
      "extra-1",
      "new",
    ]);
  });

  it("appends unseen rows and keeps newest rows first", () => {
    const current = DaemonEventRows.fromSnapshots([snapshot("old", 1000)], 1000);
    const next = DaemonEventRows.fromSnapshots([snapshot("new", 2000)], 2000);

    expect(DaemonEventRows.append(current, next).map((row) => row.message)).toEqual(["new", "old"]);
    expect(DaemonEventRows.append(current, current)).toBe(current);
  });

  it("keeps terminal outcomes visible when newer idle rows exceed the rendered limit", () => {
    const terminal = snapshot("goal failed", 1000, "failed", "failed");
    const idleRows = Array.from({ length: 11 }, (_, index) =>
      snapshot(`idle-${index}`, 2000 + index, "idle", "waiting")
    );

    const rows = DaemonEventRows.fromSnapshots([terminal, ...idleRows], 3000);

    expect(rows.map((row) => row.message)).toContain("goal failed");
    expect(rows).toHaveLength(10);
  });
});

function snapshot(
  message: string,
  timestampMs: number,
  status = "processing",
  category = "work",
): SubprocessSnapshot {
  return {
    name: "refiner",
    status: "running",
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr: [],
    events: [{
      daemon: "refiner",
      status,
      category,
      message,
      timestampMs,
    }],
  };
}
