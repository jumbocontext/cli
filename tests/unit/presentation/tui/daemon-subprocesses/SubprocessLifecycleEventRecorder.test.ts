import { EventEmitter } from "node:events";
import { jest, describe, expect, it, afterEach } from "@jest/globals";
import type { ILogger } from "../../../../../src/application/logging/ILogger.js";
import type { WorkerDaemonProcess } from "../../../../../src/application/daemons/IWorkerDaemonProcessController.js";
import type { ManagedSubprocess } from "../../../../../src/presentation/tui/daemon-subprocesses/ManagedSubprocess.js";
import { SubprocessLifecycleEventRecorder } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessLifecycleEventRecorder.js";

function logger(): jest.Mocked<ILogger> {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

function managedSubprocess(): ManagedSubprocess {
  return {
    name: "reviewer",
    child: new EventEmitter() as WorkerDaemonProcess,
    config: {
      agentId: "codex",
      pollIntervalMs: 30000,
      maxRetries: 3,
    },
    stdout: [],
    stderr: [],
    events: [],
    status: "running",
    stopRequested: false,
    terminationTimedOut: false,
  };
}

describe("SubprocessLifecycleEventRecorder", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("records lifecycle events with daemon source and suppresses duplicate adjacent statuses", () => {
    const testLogger = logger();
    const recorder = new SubprocessLifecycleEventRecorder(testLogger);
    const process = managedSubprocess();
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    recorder.recordStopping(process);
    recorder.recordStopping(process);
    recorder.recordStopped(process);

    expect(process.events).toEqual([
      {
        daemon: "reviewer",
        source: "reviewer",
        status: "stopping",
        category: "stopping",
        message: "termination requested",
        timestampMs: 1767272400000,
      },
      {
        daemon: "reviewer",
        source: "reviewer",
        status: "stopped",
        category: "stopped",
        message: "process stopped",
        timestampMs: 1767272400000,
      },
    ]);
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess event", {
      daemon: "reviewer",
      event: expect.objectContaining({ status: "stopped" }),
    });
  });

  it("keeps only the newest daemon events and bounds error log values", () => {
    const recorder = new SubprocessLifecycleEventRecorder(logger());
    const process = managedSubprocess();

    for (let index = 0; index < 55; index += 1) {
      recorder.recordDaemonEvent(process, {
        daemon: "reviewer",
        status: "processing",
        goalId: `goal_${index}`,
      });
    }

    const boundedError = recorder.boundErrorForLog(new Error(`${"x".repeat(3_000)}tail`));

    expect(process.events).toHaveLength(50);
    expect(process.events[0].goalId).toBe("goal_5");
    expect(process.events[49].goalId).toBe("goal_54");
    expect(boundedError).toEqual(expect.objectContaining({
      message: expect.stringMatching(/tail$/),
    }));
  });
});
