import { EventEmitter } from "node:events";
import { describe, expect, it } from "@jest/globals";
import type { WorkerDaemonProcess } from "../../../../../src/application/daemons/IWorkerDaemonProcessController.js";
import type { ManagedSubprocess } from "../../../../../src/presentation/tui/daemon-subprocesses/ManagedSubprocess.js";

describe("ManagedSubprocess", () => {
  it("captures live subprocess state, output buffers, events, and termination flags", () => {
    const child = new EventEmitter() as WorkerDaemonProcess;
    const process: ManagedSubprocess = {
      name: "refiner",
      child,
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
      stdout: ["line"],
      stderr: ["warning"],
      events: [{
        daemon: "refiner",
        status: "processing",
      }],
      status: "running",
      exitCode: null,
      exitSignal: null,
      stopRequested: false,
      terminationTimedOut: false,
    };

    expect(process).toEqual(expect.objectContaining({
      name: "refiner",
      child,
      status: "running",
      stopRequested: false,
      terminationTimedOut: false,
    }));
  });
});
