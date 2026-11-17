import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import type { ILogger } from "../../../../../src/application/logging/ILogger.js";
import type {
  IWorkerDaemonProcessController,
  WorkerDaemonProcess,
  WorkerDaemonTerminationResult,
  WorkerDaemonTerminationStrategy,
} from "../../../../../src/application/daemons/IWorkerDaemonProcessController.js";
import { SubprocessManager } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessManager.js";

function logger(): jest.Mocked<ILogger> {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

function childProcess(pid = 123): WorkerDaemonProcess & EventEmitter {
  const child = new EventEmitter() as WorkerDaemonProcess & EventEmitter & {
    pid: number;
    stdout: Readable;
    stderr: Readable;
  };
  child.pid = pid;
  child.stdout = new Readable({ read() {} });
  child.stderr = new Readable({ read() {} });
  return child;
}

function processController(child: WorkerDaemonProcess): jest.Mocked<IWorkerDaemonProcessController> {
  const strategy: WorkerDaemonTerminationStrategy = {
    kind: "unix-process-group",
    signal: "SIGTERM",
    escalationSignal: "SIGKILL",
    pid: -(child.pid ?? 0),
  };
  return {
    spawnDaemonProcess: jest.fn(() => child),
    terminateDaemonProcess: jest.fn(
      () => new Promise<WorkerDaemonTerminationResult>((resolve) => {
        child.on("close", (exitCode, exitSignal) => {
          resolve({
            status: "closed",
            strategy,
            exitCode,
            exitSignal,
          });
        });
      }),
    ),
    getTerminationStrategy: jest.fn(() => strategy),
  };
}

describe("SubprocessManager", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("spawns daemon targets through the injected process controller and ring-buffers output", async () => {
    const child = childProcess();
    const controller = processController(child);
    const testLogger = logger();
    const manager = new SubprocessManager(controller, testLogger);

    const snapshot = await manager.spawn("refiner");
    child.stdout?.emit("data", Buffer.from("line 1\nline 2\n"));

    expect(snapshot.status).toBe("running");
    expect(controller.spawnDaemonProcess).toHaveBeenCalledWith("refiner", {
      agentId: "codex",
      pollIntervalMs: 30000,
      maxRetries: 3,
    });
    expect(manager.getStatus("refiner").stdout).toEqual(["line 1", "line 2"]);
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess spawn requested", {
      daemon: "refiner",
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
    });
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess stdout", {
      daemon: "refiner",
      text: "line 1\nline 2\n",
    });
  });

  it("emits non-json stdout lines as model-output events", async () => {
    const child = childProcess();
    const manager = new SubprocessManager(processController(child));
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    await manager.spawn("codifier");
    child.stdout?.emit("data", Buffer.from("Model proposed a codification summary.\n"));

    expect(manager.getStatus("codifier").events).toEqual([
      {
        daemon: "codifier",
        status: "processing",
        source: "codifier",
        category: "model-output",
        message: "Model proposed a codification summary.",
        timestampMs: 1767272400000,
      },
    ]);
  });

  it("caps oversized daemon chunks, stored lines, and model-output event messages", async () => {
    const child = childProcess();
    const testLogger = logger();
    const manager = new SubprocessManager(processController(child), testLogger);
    const oversizedLine = `${"x".repeat(20_000)}tail`;

    await manager.spawn("codifier");
    child.stdout?.emit("data", Buffer.from(`${oversizedLine}\n`));
    child.stderr?.emit("data", Buffer.from(`${oversizedLine}\n`));

    const snapshot = manager.getStatus("codifier");
    expect(snapshot.stdout).toHaveLength(1);
    expect(snapshot.stderr).toHaveLength(1);
    expect(snapshot.stdout[0]).toHaveLength(2_048);
    expect(snapshot.stderr[0]).toHaveLength(2_048);
    expect(snapshot.stdout[0]).toContain("tail");
    expect(snapshot.events[0].message).toHaveLength(2_048);
    expect(snapshot.events[0].message).toContain("tail");
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess stdout", {
      daemon: "codifier",
      text: expect.stringMatching(/tail\n$/),
    });
    expect(testLogger.warn).toHaveBeenCalledWith("Daemon subprocess stderr", {
      daemon: "codifier",
      text: expect.stringMatching(/tail\n$/),
    });
    const stdoutLog = testLogger.info.mock.calls.find(([message]) => message === "Daemon subprocess stdout")?.[1];
    const stderrLog = testLogger.warn.mock.calls.find(([message]) => message === "Daemon subprocess stderr")?.[1];
    expect(String(stdoutLog?.text)).toHaveLength(16_384);
    expect(String(stderrLog?.text)).toHaveLength(16_384);
  });

  it("passes configured agent, poll interval, and retry flags, parses daemon events, and logs them", async () => {
    const child = childProcess();
    const testLogger = logger();
    const controller = processController(child);
    const manager = new SubprocessManager(controller, testLogger);
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    await manager.spawn("refiner", {
      agentId: "claude",
      pollIntervalMs: 10_000,
      maxRetries: 5,
    });
    child.stdout?.emit("data", Buffer.from("{\"daemon\":\"refiner\",\"status\":\"processing\",\"goalId\":\"goal_123\",\"attempt\":2,\"maxRetries\":5}\n"));

    expect(controller.spawnDaemonProcess).toHaveBeenCalledWith("refiner", {
      agentId: "claude",
      pollIntervalMs: 10_000,
      maxRetries: 5,
    });
    expect(manager.getStatus("refiner").events).toEqual([
      {
        daemon: "refiner",
        status: "processing",
        timestampMs: 1767272400000,
        goalId: "goal_123",
        attempt: 2,
        maxRetries: 5,
      },
    ]);
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess event", {
      daemon: "refiner",
      event: {
        daemon: "refiner",
        status: "processing",
        timestampMs: 1767272400000,
        goalId: "goal_123",
        attempt: 2,
        maxRetries: 5,
      },
    });
  });

  it("parses structured daemon events before capping retained stdout lines", async () => {
    const child = childProcess();
    const manager = new SubprocessManager(processController(child));
    const errorMessage = "x".repeat(2_048);

    await manager.spawn("reviewer");
    child.stdout?.emit("data", Buffer.from(`${JSON.stringify({
      daemon: "reviewer",
      status: "failed",
      source: "reviewer",
      category: "failed",
      errorMessage,
    })}\n`));

    const snapshot = manager.getStatus("reviewer");
    expect(snapshot.stdout).toHaveLength(1);
    expect(snapshot.stdout[0]).toHaveLength(2_048);
    expect(snapshot.events).toEqual([
      expect.objectContaining({
        daemon: "reviewer",
        status: "failed",
        source: "reviewer",
        category: "failed",
        errorMessage,
      }),
    ]);
    expect(snapshot.events[0].category).not.toBe("model-output");
  });

  it("keeps only the latest 50 parsed daemon events in memory", async () => {
    const child = childProcess();
    const manager = new SubprocessManager(processController(child));

    await manager.spawn("refiner");

    const eventLines = Array.from({ length: 55 }, (_, index) =>
      JSON.stringify({
        daemon: "refiner",
        status: "processing",
        goalId: `goal_${index}`,
        attempt: 1,
        maxRetries: 3,
      })
    ).join("\n");
    child.stdout?.emit("data", Buffer.from(`${eventLines}\n`));

    const events = manager.getStatus("refiner").events;
    expect(events).toHaveLength(50);
    expect(events[0]).toEqual(expect.objectContaining({ goalId: "goal_5" }));
    expect(events[49]).toEqual(expect.objectContaining({ goalId: "goal_54" }));
  });

  it("coalesces alternating idle polls without evicting the latest terminal outcome", async () => {
    const child = childProcess();
    const manager = new SubprocessManager(processController(child));

    await manager.spawn("refiner");
    child.stdout?.emit("data", Buffer.from(`${JSON.stringify({
      daemon: "refiner",
      status: "completed",
      category: "completed",
      message: "goal completed",
      goalId: "goal_done",
    })}\n`));

    const idleCycle = [
      JSON.stringify({ daemon: "refiner", status: "processing", category: "polling", message: "polling for goals" }),
      JSON.stringify({ daemon: "refiner", status: "idle", category: "waiting", message: "no eligible goals" }),
    ].join("\n");
    for (let index = 0; index < 60; index++) {
      child.stdout?.emit("data", Buffer.from(`${idleCycle}\n`));
    }

    const events = manager.getStatus("refiner").events;
    expect(events).toHaveLength(3);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "completed", goalId: "goal_done" }),
      expect.objectContaining({ category: "polling" }),
      expect.objectContaining({ category: "waiting" }),
    ]));
  });

  it("emits a heartbeat with advancing elapsed time when daemon activity pauses", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1767272400000);
    const child = childProcess();
    const manager = new SubprocessManager(processController(child));

    await manager.spawn("reviewer");
    child.stdout?.emit("data", Buffer.from(`${JSON.stringify({
      daemon: "reviewer",
      status: "processing",
      category: "selection",
      message: "selected goal",
      phase: "selection",
      goalId: "goal_heartbeat",
      elapsedMs: 125,
      timestampMs: 1767272400000,
    })}\n`));

    jest.advanceTimersByTime(5_000);
    const firstHeartbeat = manager.getStatus("reviewer").events.at(-1);
    expect(firstHeartbeat).toEqual(expect.objectContaining({
      category: "heartbeat",
      phase: "selection",
      goalId: "goal_heartbeat",
      elapsedMs: 5_125,
    }));

    jest.advanceTimersByTime(5_000);
    expect(manager.getStatus("reviewer").events.at(-1)).toEqual(expect.objectContaining({
      category: "heartbeat",
      elapsedMs: 10_125,
    }));

    child.emit("close", 0, null);
    jest.useRealTimers();
  });

  it("logs daemon stderr and child process failures through ILogger", async () => {
    const child = childProcess();
    const testLogger = logger();
    const manager = new SubprocessManager(processController(child), testLogger);
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    await manager.spawn("refiner");
    child.stderr?.emit("data", Buffer.from("refiner failed\n"));
    child.emit("error", new Error("spawn failed"));

    expect(testLogger.warn).toHaveBeenCalledWith("Daemon subprocess stderr", {
      daemon: "refiner",
      text: "refiner failed\n",
    });
    expect(testLogger.error).toHaveBeenCalledWith(
      "Daemon subprocess error",
      expect.any(Error),
      { daemon: "refiner", stopRequested: false, status: "failed" },
    );
    expect(manager.getStatus("refiner").events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        daemon: "refiner",
        status: "processing",
        source: "refiner",
        category: "stderr",
        message: "refiner failed",
        timestampMs: 1767272400000,
        errorMessage: "refiner failed",
      }),
      expect.objectContaining({
        daemon: "refiner",
        status: "failed",
        source: "refiner",
        category: "failed",
        message: "process failed",
        timestampMs: 1767272400000,
        errorMessage: "spawn failed",
      }),
    ]));
  });

  it("delegates process termination and records stopping and stopped lifecycle events", async () => {
    const child = childProcess(456);
    const controller = processController(child);
    const manager = new SubprocessManager(controller);
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    await manager.spawn("reviewer");
    const termination = manager.terminate("reviewer");

    expect(manager.getStatus("reviewer")).toEqual(expect.objectContaining({
      status: "stopping",
      stopRequested: true,
    }));
    child.emit("close", 0, null);
    const terminated = await termination;

    expect(controller.getTerminationStrategy).toHaveBeenCalledWith(child);
    expect(controller.terminateDaemonProcess).toHaveBeenCalledWith(child);
    expect(terminated.events).toEqual([
      expect.objectContaining({
        daemon: "reviewer",
        status: "stopping",
        source: "reviewer",
        category: "stopping",
        message: "termination requested",
        timestampMs: 1767272400000,
      }),
      expect.objectContaining({
        daemon: "reviewer",
        status: "stopped",
        source: "reviewer",
        category: "stopped",
        message: "process stopped",
        timestampMs: 1767272400000,
        exitCode: 0,
      }),
    ]);
  });

  it("prevents duplicate daemon spawns while a previous child is stopping", async () => {
    const child = childProcess(457);
    const controller = processController(child);
    const manager = new SubprocessManager(controller);

    await manager.spawn("reviewer");
    const termination = manager.terminate("reviewer");
    const snapshot = await manager.spawn("reviewer");

    expect(snapshot).toEqual(expect.objectContaining({
      status: "stopping",
      pid: 457,
      stopRequested: true,
    }));
    expect(controller.spawnDaemonProcess).toHaveBeenCalledTimes(1);

    child.emit("close", 0, null);
    await termination;
  });

  it("marks timeout escalation as failed and keeps later closes failed", async () => {
    const child = childProcess(458);
    const controller = processController(child);
    controller.terminateDaemonProcess.mockResolvedValue({
      status: "timeout",
      strategy: {
        kind: "unix-process-group",
        signal: "SIGTERM",
        escalationSignal: "SIGKILL",
        pid: -458,
      },
      timeoutMs: 25,
      escalation: {
        kind: "unix-process-group-kill",
        signal: "SIGKILL",
        pid: -458,
      },
    });
    const testLogger = logger();
    const manager = new SubprocessManager(controller, testLogger);

    await manager.spawn("reviewer");
    const snapshot = await manager.terminate("reviewer");
    child.emit("close", null, "SIGKILL");

    expect(snapshot).toEqual(expect.objectContaining({
      status: "failed",
      terminationTimedOut: true,
      stderr: expect.arrayContaining([
        "Timed out after 25ms waiting for daemon process close.",
      ]),
    }));
    expect(manager.getStatus("reviewer")).toEqual(expect.objectContaining({
      status: "failed",
      exitSignal: "SIGKILL",
      terminationTimedOut: true,
    }));
    expect(testLogger.error).toHaveBeenCalledWith(
      "Daemon subprocess termination timed out",
      expect.any(Error),
      expect.objectContaining({
        daemon: "reviewer",
        pid: 458,
        timeoutMs: 25,
      }),
    );
  });

  it("captures termination failures without throwing into the TUI input handler", async () => {
    const child = childProcess(789);
    const controller = processController(child);
    controller.terminateDaemonProcess.mockRejectedValue(new Error("taskkill failed"));
    const testLogger = logger();
    const manager = new SubprocessManager(controller, testLogger);

    await manager.spawn("refiner");
    await expect(manager.terminate("refiner")).resolves.toEqual(
      expect.objectContaining({
        status: "failed",
        stderr: expect.arrayContaining(["taskkill failed"]),
      }),
    );
    expect(testLogger.error).toHaveBeenCalledWith(
      "Daemon subprocess termination failed",
      expect.any(Error),
      { daemon: "refiner", pid: 789, stopRequested: false },
    );
  });

  it("keeps a requested stop stopped when child error and close events arrive after termination", async () => {
    const child = childProcess(321);
    const testLogger = logger();
    const manager = new SubprocessManager(processController(child), testLogger);

    await manager.spawn("codifier");
    const termination = manager.terminate("codifier");
    child.emit("error", new Error("process already terminated"));

    expect(manager.getStatus("codifier")).toEqual(expect.objectContaining({
      status: "stopping",
      stopRequested: true,
      stderr: expect.arrayContaining(["process already terminated"]),
    }));

    child.emit("close", null, "SIGTERM");
    await termination;

    expect(manager.getStatus("codifier")).toEqual(expect.objectContaining({
      status: "stopped",
      exitCode: null,
      exitSignal: "SIGTERM",
      stopRequested: true,
      stderr: expect.arrayContaining(["process already terminated"]),
    }));
    expect(testLogger.error).toHaveBeenCalledWith(
      "Daemon subprocess error",
      expect.any(Error),
      { daemon: "codifier", stopRequested: true, status: "stopping" },
    );
  });

  it("reports unexpected signal exits as failed when no stop was requested", async () => {
    const child = childProcess(654);
    const testLogger = logger();
    const manager = new SubprocessManager(processController(child), testLogger);

    await manager.spawn("refiner");
    child.emit("close", null, "SIGTERM");

    expect(manager.getStatus("refiner")).toEqual(expect.objectContaining({
      status: "failed",
      exitCode: null,
      exitSignal: "SIGTERM",
      stopRequested: false,
    }));
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess closed", {
      daemon: "refiner",
      exitCode: null,
      signal: "SIGTERM",
      stopRequested: false,
      status: "failed",
    });
  });
});
