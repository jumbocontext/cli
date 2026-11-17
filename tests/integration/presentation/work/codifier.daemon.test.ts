import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import path from "node:path";
import fs from "fs-extra";
import { DaemonBootstrapFixture } from "../../../fixtures/daemon-bootstrap.js";
import { snapshot } from "../../../fixtures/compiled-cli.js";
import { applicationRootInHome } from "../../../fixtures/application-root.js";
import type { PollingLoopOptions } from "../../../../src/application/daemons/PollingLoop.js";

const processNextMock = jest.fn();
const pollingRunMock = jest.fn(async ({ processOptions }: PollingLoopOptions) => {
  processOptions.emit?.({
    daemon: "codifier",
    status: "idle",
    source: "codifier",
    category: "waiting",
    message: "awaiting approved goals",
  });
});
const buildMock = jest.fn<() => Promise<unknown>>();
const disposeMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const findNearestMock = jest.fn();
const contextProjectPathMock = jest.fn(() => findNearestMock());
const agentCliGatewayMock = jest.fn();
const codifierProcessManagerMock = jest.fn(() => ({ processNext: processNextMock }));
const intervalTickerMock = jest.fn(function (this: { intervalMs: number }, intervalMs: number) {
  this.intervalMs = intervalMs;
});
const processSignalSourceMock = jest.fn(function (
  this: { isShutdownRequested: boolean; onShutdown: jest.Mock },
) {
  this.isShutdownRequested = false;
  this.onShutdown = jest.fn();
});

jest.unstable_mockModule("../../../../src/application/daemons/PollingLoop.js", () => ({
  PollingLoop: jest.fn(() => ({ run: pollingRunMock })),
}));

jest.unstable_mockModule("../../../../src/infrastructure/daemons/IntervalTicker.js", () => ({
  IntervalTicker: intervalTickerMock,
}));

jest.unstable_mockModule("../../../../src/infrastructure/daemons/ProcessSignalSource.js", () => ({
  ProcessSignalSource: processSignalSourceMock,
}));

class LeafContainerBuilderStub {
  build = buildMock;
  dispose = disposeMock;
  withGoalStatusReaderFeature() {
    return this;
  }
  withGoalCodifyingStartedProjectorFeature() {
    return this;
  }
  withGoalClaimPolicyFeature() {
    return this;
  }
  withWorkerIdentityReaderFeature() {
    return this;
  }
  withCodifyGoalFeature() {
    return this;
  }
  withTelemetryClientFeature() {
    return this;
  }
}
const leafContainerBuilderMock = jest.fn(() => new LeafContainerBuilderStub());

jest.unstable_mockModule("../../../../src/infrastructure/host/LeafContainerBuilder.js", () => ({
  LeafContainerBuilder: leafContainerBuilderMock,
}));

jest.unstable_mockModule("../../../../src/infrastructure/host/ContextProjectPath.js", () => ({
  ContextProjectPath: { get: contextProjectPathMock },
}));

jest.unstable_mockModule("../../../../src/infrastructure/agents/AgentCliGateway.js", () => ({
  AgentCliGateway: agentCliGatewayMock,
}));

jest.unstable_mockModule("../../../../src/application/context/goals/codify/CodifierProcessManager.js", () => ({
  CodifierProcessManager: codifierProcessManagerMock,
}));

const { runCodifierDaemon } = await import("../../../../src/presentation/work/codifier.daemon.js");

describe("codifier.daemon", () => {
  const exitCodeDescriptor = Object.getOwnPropertyDescriptor(process, "exitCode");
  let stderrSpy: jest.SpiedFunction<typeof process.stderr.write>;
  let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>;

  beforeEach(() => {
    processNextMock.mockReset();
    pollingRunMock.mockClear();
    buildMock.mockReset();
    disposeMock.mockClear();
    leafContainerBuilderMock.mockClear();
    findNearestMock.mockReset().mockReturnValue(path.resolve("project"));
    applicationRootInHome(path.resolve("user-home"));
    contextProjectPathMock.mockClear();
    agentCliGatewayMock.mockClear();
    codifierProcessManagerMock.mockClear();
    intervalTickerMock.mockClear();
    processSignalSourceMock.mockClear();
    process.exitCode = undefined;
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    buildMock.mockResolvedValue({
      goalStatusReader: {},
      goalCodifyingStartedProjector: {},
      goalClaimPolicy: {},
      workerIdentityReader: {},
      telemetryClient: {},
    });
  });

  afterEach(() => {
    if (exitCodeDescriptor) Object.defineProperty(process, "exitCode", exitCodeDescriptor);
    else Reflect.deleteProperty(process, "exitCode");
    jest.restoreAllMocks();
  });

  it("runCodifierDaemon_validContext_delegatesAndEmitsEvents", async () => {
    // Arrange
    const argv = [
      "node",
      "codifier.daemon.js",
      "--agent",
      "codex",
      "--max-retries",
      "2",
      "--poll-interval-ms",
      "5000",
    ];
    // Act
    await runCodifierDaemon(argv);

    // Assert
    expect(leafContainerBuilderMock).toHaveBeenCalledTimes(1);
    expect(buildMock).toHaveBeenCalledTimes(1);
    expect(buildMock).toHaveBeenCalledWith();
    expect(disposeMock).toHaveBeenCalledTimes(1);
    expect(pollingRunMock).toHaveBeenCalledWith(expect.objectContaining({
      processManager: expect.objectContaining({ processNext: processNextMock }),
      processOptions: expect.objectContaining({
        agentId: "codex",
        maxRetries: 2,
        emit: expect.any(Function),
      }),
      ticker: expect.objectContaining({ intervalMs: 5000 }),
      shutdownSignal: expect.objectContaining({ isShutdownRequested: false }),
    }));
    expect(intervalTickerMock).toHaveBeenCalledWith(5000);
    expect(processSignalSourceMock).toHaveBeenCalled();
    expect(JSON.parse(String(stdoutSpy.mock.calls[0][0]))).toMatchObject({ daemon: "codifier", status: "idle", category: "waiting" });
  });

  it("runCodifierDaemon_compositionFails_disposesAndPropagatesFailure", async () => {
    // Arrange
    const failure = new Error("composition failed");
    buildMock.mockRejectedValueOnce(failure);

    // Act
    const running = runCodifierDaemon(["node", "codifier.daemon.js"]);
    // Assert
    await expect(running).rejects.toBe(failure);

    expect(pollingRunMock).not.toHaveBeenCalled();
    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  it("runCodifierDaemon_workExhausted_doesNotFailProcess", async () => {
    // Arrange
    pollingRunMock.mockImplementationOnce(async ({ processOptions }) => {
      processOptions.emit?.({
        daemon: "codifier",
        status: "exhausted",
        source: "codifier",
        category: "exhausted",
        message: "codification attempts exhausted",
        goalId: "goal_1",
        attempt: 3,
        maxRetries: 3,
      });
    });

    // Act
    await runCodifierDaemon(["node", "codifier.daemon.js"]);

    // Assert
    expect(process.exitCode).toBeUndefined();
    expect(JSON.parse(String(stdoutSpy.mock.calls[0][0]))).toMatchObject({ daemon: "codifier", status: "exhausted", goalId: "goal_1", attempt: 3, maxRetries: 3 });
  });

  it("runCodifierDaemon_pollingPending_keepsResourcesAliveUntilCompletion", async () => {
    // Arrange
    let entered!: () => void;
    let finish!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const pending = new Promise<void>(resolve => { finish = resolve; });
    pollingRunMock.mockImplementationOnce(async () => { entered(); await pending; });
    // Act
    const running = runCodifierDaemon(["node", "codifier.daemon.js"]);
    await started;
    // Assert
    expect(disposeMock).not.toHaveBeenCalled();
    finish();
    await running;
    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  it("runCodifierDaemon_constructionFails_disposesAndPropagatesFailure", async () => {
    // Arrange
    const failure = new Error("build failed");
    buildMock.mockRejectedValueOnce(failure);
    // Act
    const running = runCodifierDaemon(["node", "codifier.daemon.js"]);
    // Assert
    await expect(running).rejects.toBe(failure);
    expect(disposeMock).toHaveBeenCalledTimes(1);
    expect(pollingRunMock).not.toHaveBeenCalled();
  });

  it.each(["outside", "nested"] as const)("runCodifierDaemon_%sContext_routesCompiledBootstrapWithoutChangingBytes", async condition => {
    // Arrange
    const fixture = await DaemonBootstrapFixture.create();
    try {
      const cwd = fixture[condition];
      const before = await snapshot(cwd);
      const database = await fs.readFile(fixture.root.getProjectDbFile(fixture.project));
      // Act
      const result = await fixture.invoke("codifier", cwd);
      // Assert
      expect({ status: result.status, error: result.status ? result.stderr : undefined }).toEqual({ status: 0 });
      expect(result.records).toEqual([{ compositionImported: true }, { root: fixture.root.getProjectDirectory(condition === "outside" ? fixture.outside : fixture.project) }]);
      expect(await snapshot(cwd)).toEqual(before);
      expect(await fs.readFile(fixture.root.getProjectDbFile(fixture.project))).toEqual(database);
    } finally { await fixture.dispose(); }
  });
});
