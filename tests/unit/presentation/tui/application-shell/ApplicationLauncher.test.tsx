import { jest, describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import type React from "react";
import type { ApplicationLauncherDependencies } from "../../../../../src/presentation/tui/application-shell/ApplicationLauncherDependencies.js";
import type { ILogger } from "../../../../../src/application/logging/ILogger.js";
import type { ISubprocessManager } from "../../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

const mockWaitUntilExit = jest.fn<() => Promise<void>>();
const mockRender = jest.fn<(element: React.ReactElement) => { waitUntilExit: typeof mockWaitUntilExit }>();
jest.unstable_mockModule("ink", () => ({ render: mockRender }));
jest.unstable_mockModule("../../../../../src/presentation/tui/application-shell/App.js", () => ({ App: () => null }));
const { ApplicationLauncher } = await import("../../../../../src/presentation/tui/application-shell/ApplicationLauncher.js");

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((release) => { resolve = release; });
  return { promise, resolve };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const emptyDependencies = (): ApplicationLauncherDependencies => ({ stateReaderControllers: {}, actionControllers: {} });
const subprocessManager = (terminateAll = jest.fn<() => Promise<void>>().mockResolvedValue()): ISubprocessManager => ({
  spawn: jest.fn(), terminate: jest.fn(), terminateAll, getStatus: jest.fn(), getAllStatuses: jest.fn(() => []),
});
const logger = (): ILogger => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() });

describe("ApplicationLauncher", () => {
  beforeEach(() => {
    mockWaitUntilExit.mockReset().mockResolvedValue();
    mockRender.mockReset().mockReturnValue({ waitUntilExit: mockWaitUntilExit });
  });
  afterEach(() => { jest.restoreAllMocks(); });

  it("renders empty capabilities for initialization-only startup", async () => {
    await new ApplicationLauncher("1.2.3", emptyDependencies()).launch();
    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(mockWaitUntilExit).toHaveBeenCalledTimes(1);
    expect(mockRender.mock.calls[0][0].props).toMatchObject({
      version: "1.2.3", stateReaderControllers: {}, actionControllers: {},
      settingsReader: undefined, cliUpdateController: undefined,
    });
  });

  it("passes the explicit readers, actions, settings, update access and initialization callback unchanged", async () => {
    const dependencies: ApplicationLauncherDependencies = {
      stateReaderControllers: { getGoalsController: { handle: jest.fn() } },
      actionControllers: { planProjectInitController: { handle: jest.fn() } },
      settingsReader: { read: jest.fn(), write: jest.fn() },
      cliUpdateController: { check: jest.fn(), upgrade: jest.fn() },
      onProjectInitialized: jest.fn<NonNullable<ApplicationLauncherDependencies["onProjectInitialized"]>>().mockResolvedValue({}),
    };
    await new ApplicationLauncher("1.2.3", dependencies, "C:\\projects\\jumbo\\cli").launch();
    const props = (mockRender.mock.calls[0][0] as React.ReactElement<ApplicationLauncherDependencies & { directoryPath: string }>).props;
    expect(props.directoryPath).toBe("C:\\projects\\jumbo\\cli");
    expect(props.stateReaderControllers).toBe(dependencies.stateReaderControllers);
    expect(props.actionControllers).toBe(dependencies.actionControllers);
    expect(props.settingsReader).toBe(dependencies.settingsReader);
    expect(props.cliUpdateController).toBe(dependencies.cliUpdateController);
    expect(props.onProjectInitialized).toBe(dependencies.onProjectInitialized);
    expect(dependencies.onProjectInitialized).not.toHaveBeenCalled();
  });

  it("owns one subprocess session, passes its logger, and awaits normal cleanup after Ink exits", async () => {
    const exit = deferred();
    const cleanup = deferred();
    const terminateAll = jest.fn(() => cleanup.promise);
    const manager = subprocessManager(terminateAll);
    const factory = jest.fn(() => manager);
    const log = logger();
    mockWaitUntilExit.mockReturnValueOnce(exit.promise);
    let settled = false;
    const launch = new ApplicationLauncher("1", {
      ...emptyDependencies(), logger: log, subprocessManagerFactory: factory,
    }).launch().then(() => { settled = true; });
    await tick();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith(log);
    expect(mockRender.mock.calls[0][0].props).toMatchObject({ subprocessManager: manager });
    expect(terminateAll).not.toHaveBeenCalled();
    exit.resolve();
    await tick();
    expect(terminateAll).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);
    cleanup.resolve();
    await launch;
    expect(settled).toBe(true);
    expect(terminateAll).toHaveBeenCalledTimes(1);
  });

  it.each(["render", "wait"])("awaits subprocess cleanup before reporting %s failure", async (stage) => {
    const error = new Error(`${stage} failed`);
    if (stage === "render") mockRender.mockImplementationOnce(() => { throw error; });
    else mockWaitUntilExit.mockRejectedValueOnce(error);
    const cleanup = deferred();
    const terminateAll = jest.fn(() => cleanup.promise);
    let settled = false;
    const launch = new ApplicationLauncher("1", {
      ...emptyDependencies(), subprocessManagerFactory: () => subprocessManager(terminateAll),
    }).launch().catch((failure: unknown) => { settled = true; return failure; });
    await tick();
    expect(terminateAll).toHaveBeenCalledTimes(1);
    expect(settled).toBe(false);
    cleanup.resolve();
    expect(await launch).toBe(error);
  });

  it("logs and rejects when subprocess cleanup fails after Ink exits", async () => {
    const error = new Error("cleanup failed");
    const terminateAll = jest.fn<() => Promise<void>>().mockRejectedValue(error);
    const log = logger();
    await expect(new ApplicationLauncher("1", {
      ...emptyDependencies(), logger: log, subprocessManagerFactory: () => subprocessManager(terminateAll),
    }).launch()).rejects.toBe(error);
    expect(log.error).toHaveBeenCalledWith("TUI daemon subprocess shutdown failed", error, { reason: "ink-exit" });
  });

  it.each(["render", "wait"])("preserves both %s and cleanup failures", async (stage) => {
    const primary = new Error("launch failed");
    const cleanup = new Error("cleanup failed");
    if (stage === "render") mockRender.mockImplementationOnce(() => { throw primary; });
    else mockWaitUntilExit.mockRejectedValueOnce(primary);
    const terminateAll = jest.fn<() => Promise<void>>().mockRejectedValue(cleanup);
    await expect(new ApplicationLauncher("1", {
      ...emptyDependencies(), subprocessManagerFactory: () => subprocessManager(terminateAll),
    }).launch()).rejects.toMatchObject({ errors: [primary, cleanup] });
    expect(terminateAll).toHaveBeenCalledTimes(1);
  });

  it("awaits launcher signal cleanup before exiting and removes handlers (without testing runtime coordination)", async () => {
    const exit = deferred();
    const cleanup = deferred();
    const handlers = new Map<string | symbol, Array<(...args: unknown[]) => void>>();
    const terminateAll = jest.fn(() => cleanup.promise);
    const on = jest.spyOn(process, "on").mockImplementation((event, handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler as (...args: unknown[]) => void]);
      return process;
    });
    const off = jest.spyOn(process, "off").mockImplementation((event, handler) => {
      handlers.set(event, (handlers.get(event) ?? []).filter((registered) => registered !== handler));
      return process;
    });
    const processExit = jest.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    mockWaitUntilExit.mockReturnValueOnce(exit.promise);
    const launch = new ApplicationLauncher("1", {
      ...emptyDependencies(), subprocessManagerFactory: () => subprocessManager(terminateAll),
    }).launch();
    await tick();
    const signalHandler = handlers.get("SIGTERM")?.[0];
    expect(signalHandler).toBeDefined();
    signalHandler?.();
    await tick();
    expect(terminateAll).toHaveBeenCalledTimes(1);
    expect(processExit).not.toHaveBeenCalled();
    cleanup.resolve();
    await tick();
    expect(processExit).toHaveBeenCalledWith(143);
    for (const event of ["beforeExit", "SIGINT", "SIGTERM", "SIGHUP"]) {
      expect(off).toHaveBeenCalledWith(event, expect.any(Function));
      expect(handlers.get(event)).toEqual([]);
    }
    exit.resolve();
    await launch;
    expect(terminateAll).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledWith("beforeExit", expect.any(Function));
  });
});
