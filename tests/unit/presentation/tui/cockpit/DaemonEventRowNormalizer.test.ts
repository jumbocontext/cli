import { describe, expect, it } from "@jest/globals";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { DaemonEventRowNormalizer } from "../../../../../src/presentation/tui/cockpit/DaemonEventRowNormalizer.js";
import type { SubprocessSnapshot } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

describe("DaemonEventRowNormalizer", () => {
  it("normalizes event fields into display rows", () => {
    const rows = DaemonEventRowNormalizer.fromSnapshot({
      ...snapshot("running"),
      events: [{
        daemon: "reviewer",
        source: "agent-process",
        category: "retry-attempt",
        status: "unknown-status",
        message: "review failed",
        goalId: "goal_123456789",
        timestampMs: 1767272400000,
      }],
    }, 1767272400500);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(expect.objectContaining({
      source: "agent...",
      category: "retry-att...",
      timestampMs: 1767272400000,
      message: expect.stringContaining("review failed goal_123"),
    }));
  });

  it("adds lifecycle rows for visible daemon state transitions", () => {
    expect(DaemonEventRowNormalizer.fromSnapshot(snapshot("running"), 1000)[0].category).toBe("starting");
    expect(DaemonEventRowNormalizer.fromSnapshot({
      ...snapshot("stopping"),
      stopRequested: true,
    }, 1000)[0].category).toBe("stopping");
    expect(DaemonEventRowNormalizer.fromSnapshot({
      ...snapshot("failed"),
      stderr: ["failure"],
    }, 1000)[0].category).toBe("failed");
    expect(DaemonEventRowNormalizer.fromSnapshot({
      ...snapshot("stopped"),
      exitCode: 0,
    }, 1000)[0].category).toBe("stopped");
  });
});

function snapshot(status: "failed" | "running" | "stopped" | "stopping"): SubprocessSnapshot {
  return {
    name: "reviewer",
    status,
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr: [],
    events: [],
  };
}
