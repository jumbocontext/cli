import { EventEmitter } from "node:events";
import { describe, expect, it } from "@jest/globals";
import type { WorkerDaemonProcess } from "../../../../../src/application/daemons/IWorkerDaemonProcessController.js";
import type { ManagedSubprocess } from "../../../../../src/presentation/tui/daemon-subprocesses/ManagedSubprocess.js";
import { SubprocessSnapshotMapper } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessSnapshotMapper.js";

describe("SubprocessSnapshotMapper", () => {
  it("maps stopped daemons to default empty snapshots", () => {
    const mapper = new SubprocessSnapshotMapper();

    expect(mapper.stopped("codifier")).toEqual({
      name: "codifier",
      status: "stopped",
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
      stdout: [],
      stderr: [],
      events: [],
    });
  });

  it("copies managed subprocess buffers so snapshots cannot mutate live state", () => {
    const mapper = new SubprocessSnapshotMapper();
    const child = new EventEmitter() as WorkerDaemonProcess & { pid: number };
    child.pid = 42;
    const process: ManagedSubprocess = {
      name: "reviewer",
      child,
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
      stdout: ["out"],
      stderr: ["err"],
      events: [{ daemon: "reviewer", status: "failed" }],
      status: "failed",
      exitCode: 1,
      exitSignal: null,
      stopRequested: false,
      terminationTimedOut: false,
    };

    const snapshot = mapper.fromManagedSubprocess(process);
    snapshot.stdout.push("mutated");
    snapshot.events.push({ daemon: "reviewer", status: "stopped" });

    expect(process.stdout).toEqual(["out"]);
    expect(process.events).toEqual([{ daemon: "reviewer", status: "failed" }]);
    expect(snapshot).toEqual(expect.objectContaining({
      name: "reviewer",
      pid: 42,
      status: "failed",
      exitCode: 1,
      terminationTimedOut: false,
    }));
  });
});
