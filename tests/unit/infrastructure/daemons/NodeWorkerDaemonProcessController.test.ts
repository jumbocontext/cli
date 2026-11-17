import { EventEmitter } from "node:events";
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const spawnMock = jest.fn();
const execFileMock = jest.fn();

jest.unstable_mockModule("node:child_process", () => ({
  spawn: spawnMock,
  execFile: execFileMock,
}));

const {
  NodeWorkerDaemonProcessController,
  getNodeWorkerDaemonTerminationStrategy,
} = await import("../../../../src/infrastructure/daemons/NodeWorkerDaemonProcessController.js");

describe("NodeWorkerDaemonProcessController", () => {
  beforeEach(() => {
    spawnMock.mockReset();
    execFileMock.mockReset();
    execFileMock.mockImplementation((_file, _args, callback) => callback(null, "", ""));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("spawns daemon targets with the configured agent, poll interval, and retries", () => {
    const child = new EventEmitter();
    spawnMock.mockReturnValue(child);
    const controller = new NodeWorkerDaemonProcessController();

    expect(controller.spawnDaemonProcess("refiner", {
      agentId: "claude",
      pollIntervalMs: 10_000,
      maxRetries: 5,
    })).toBe(child);

    expect(spawnMock).toHaveBeenCalledWith(
      process.execPath,
      [
        expect.stringMatching(/presentation[\\/]work[\\/]refiner\.daemon\.js$/),
        "--agent",
        "claude",
        "--poll-interval-ms",
        "10000",
        "--max-retries",
        "5",
      ],
      expect.objectContaining({
        cwd: process.cwd(),
        detached: process.platform !== "win32",
      }),
    );
  });

  it("passes an explicitly configured environment to the daemon child", () => {
    const child = new EventEmitter();
    spawnMock.mockReturnValue(child);
    const environment = {
      PATH: "C:\\fake-agent-bin",
      JUMBO_AGENT_COMMAND_VIBE: process.execPath,
    };
    const controller = new NodeWorkerDaemonProcessController(environment);

    controller.spawnDaemonProcess("codifier", {
      agentId: "vibe",
      pollIntervalMs: 10_000,
      maxRetries: 1,
    });

    expect(spawnMock).toHaveBeenCalledWith(
      process.execPath,
      expect.any(Array),
      expect.objectContaining({ env: environment }),
    );
  });

  it("defines Unix process-group signaling for non-Windows hosts", () => {
    expect(getNodeWorkerDaemonTerminationStrategy("linux", 456)).toEqual({
      kind: "unix-process-group",
      signal: "SIGTERM",
      escalationSignal: "SIGKILL",
      pid: -456,
    });
  });

  it("defines Windows task tree termination with forced escalation", () => {
    expect(getNodeWorkerDaemonTerminationStrategy("win32", 456)).toEqual({
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", "456"],
      escalationArgs: ["/F", "/T", "/PID", "456"],
    });
  });

  it("resolves Unix process-group termination after child close", async () => {
    const child = childProcess(456);
    const controller = new NodeWorkerDaemonProcessController();
    jest.spyOn(controller, "getTerminationStrategy").mockReturnValue({
      kind: "unix-process-group",
      signal: "SIGTERM",
      escalationSignal: "SIGKILL",
      pid: -456,
    });
    const killSpy = jest.spyOn(globalThis.process, "kill").mockImplementation(() => true);

    const termination = controller.terminateDaemonProcess(child, 1000);
    child.emit("close", 0, null);

    await expect(termination).resolves.toEqual({
      status: "closed",
      strategy: {
        kind: "unix-process-group",
        signal: "SIGTERM",
        escalationSignal: "SIGKILL",
        pid: -456,
      },
      exitCode: 0,
      exitSignal: null,
    });
    expect(killSpy).toHaveBeenCalledWith(-456, "SIGTERM");
  });

  it("resolves Windows task-tree termination after child close", async () => {
    const child = childProcess(789);
    const controller = new NodeWorkerDaemonProcessController();
    jest.spyOn(controller, "getTerminationStrategy").mockReturnValue({
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", "789"],
      escalationArgs: ["/F", "/T", "/PID", "789"],
    });

    const termination = controller.terminateDaemonProcess(child, 1000);
    child.emit("close", null, "SIGTERM");

    await expect(termination).resolves.toEqual({
      status: "closed",
      strategy: {
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", "789"],
      escalationArgs: ["/F", "/T", "/PID", "789"],
      },
      exitCode: null,
      exitSignal: "SIGTERM",
    });
    expect(execFileMock).toHaveBeenCalledWith(
      "taskkill",
      ["/F", "/T", "/PID", "789"],
      expect.any(Function),
    );
  });

  it("reports Windows task-tree command failures", async () => {
    const child = childProcess(790);
    const controller = new NodeWorkerDaemonProcessController();
    jest.spyOn(controller, "getTerminationStrategy").mockReturnValue({
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", "790"],
      escalationArgs: ["/F", "/T", "/PID", "790"],
    });
    execFileMock.mockImplementation((_file, _args, callback) => callback(new Error("taskkill failed"), "", ""));

    await expect(controller.terminateDaemonProcess(child, 1000)).rejects.toThrow("taskkill failed");
  });

  it("escalates Unix process-group termination after timeout", async () => {
    jest.useFakeTimers();
    const child = childProcess(456);
    const controller = new NodeWorkerDaemonProcessController();
    jest.spyOn(controller, "getTerminationStrategy").mockReturnValue({
      kind: "unix-process-group",
      signal: "SIGTERM",
      escalationSignal: "SIGKILL",
      pid: -456,
    });
    const killSpy = jest.spyOn(globalThis.process, "kill").mockImplementation(() => true);

    const termination = controller.terminateDaemonProcess(child, 25);
    await jest.advanceTimersByTimeAsync(25);

    await expect(termination).resolves.toEqual({
      status: "timeout",
      strategy: {
        kind: "unix-process-group",
        signal: "SIGTERM",
        escalationSignal: "SIGKILL",
        pid: -456,
      },
      timeoutMs: 25,
      escalation: {
        kind: "unix-process-group-kill",
        signal: "SIGKILL",
        pid: -456,
      },
    });
    expect(killSpy).toHaveBeenCalledWith(-456, "SIGTERM");
    expect(killSpy).toHaveBeenCalledWith(-456, "SIGKILL");
  });

  it("escalates Windows task-tree termination after timeout", async () => {
    jest.useFakeTimers();
    const child = childProcess(791);
    const controller = new NodeWorkerDaemonProcessController();
    jest.spyOn(controller, "getTerminationStrategy").mockReturnValue({
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", "791"],
      escalationArgs: ["/F", "/T", "/PID", "791"],
    });

    const termination = controller.terminateDaemonProcess(child, 25);
    await jest.advanceTimersByTimeAsync(25);

    await expect(termination).resolves.toEqual({
      status: "timeout",
      strategy: {
        kind: "windows-tree",
        command: "taskkill",
        args: ["/F", "/T", "/PID", "791"],
        escalationArgs: ["/F", "/T", "/PID", "791"],
      },
      timeoutMs: 25,
      escalation: {
        kind: "windows-tree-force",
        command: "taskkill",
        args: ["/F", "/T", "/PID", "791"],
      },
    });
    expect(execFileMock).toHaveBeenCalledWith(
      "taskkill",
      ["/F", "/T", "/PID", "791"],
      expect.any(Function),
    );
    expect(execFileMock).toHaveBeenCalledWith(
      "taskkill",
      ["/F", "/T", "/PID", "791"],
      expect.any(Function),
    );
  });
});

function childProcess(pid: number): EventEmitter & { readonly pid: number } {
  const child = new EventEmitter() as EventEmitter & { pid: number };
  child.pid = pid;
  return child;
}
