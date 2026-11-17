import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import path from "node:path";
import fs from "fs-extra";
import { DaemonBootstrapFixture } from "../../../fixtures/daemon-bootstrap.js";
import { snapshot } from "../../../fixtures/compiled-cli.js";
import { applicationRootInHome } from "../../../fixtures/application-root.js";
import type { PollingLoopOptions } from "../../../../src/application/daemons/PollingLoop.js";

const pollingRunMock = jest.fn(async ({ processOptions }: PollingLoopOptions) => {
  processOptions.emit?.({
    daemon: "reviewer",
    status: "idle",
    source: "reviewer",
    category: "waiting",
    message: "awaiting submitted goals",
  });
});
const buildMock = jest.fn<() => Promise<unknown>>();
const disposeMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const findNearestMock = jest.fn();

class LeafContainerBuilderStub {
  build = buildMock;
  dispose = disposeMock;
  withGoalStatusReaderFeature() { return this; }
  withGoalContextReaderFeature() { return this; }
  withGoalClaimPolicyFeature() { return this; }
  withWorkerIdentityReaderFeature() { return this; }
  withReviewGoalFeature() { return this; }
  withTelemetryClientFeature() { return this; }
}
const leafContainerBuilderMock = jest.fn(() => new LeafContainerBuilderStub());

jest.unstable_mockModule("../../../../src/application/daemons/PollingLoop.js", () => ({
  PollingLoop: jest.fn(() => ({ run: pollingRunMock })),
}));
jest.unstable_mockModule("../../../../src/infrastructure/host/ContextProjectPath.js", () => ({
  ContextProjectPath: { get: findNearestMock },
}));
jest.unstable_mockModule("../../../../src/infrastructure/host/LeafContainerBuilder.js", () => ({
  LeafContainerBuilder: leafContainerBuilderMock,
}));
jest.unstable_mockModule("../../../../src/infrastructure/daemons/ProcessSignalSource.js", () => ({
  ProcessSignalSource: jest.fn(),
}));

const { runReviewerDaemon } = await import("../../../../src/presentation/work/reviewer.daemon.js");

describe("reviewer.daemon", () => {
  let stdoutSpy: jest.SpiedFunction<typeof process.stdout.write>;

  beforeEach(() => {
    jest.clearAllMocks();
    findNearestMock.mockReturnValue(path.resolve("project"));
    applicationRootInHome(path.resolve("user-home"));
    buildMock.mockResolvedValue({
      goalStatusReader: {},
      goalContextReader: {},
      goalClaimPolicy: {},
      workerIdentityReader: {},
      telemetryClient: {},
    });
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("runReviewerDaemon_validContext_delegatesToPollingLoop", async () => {
    // Arrange
    const argv = ["node", "reviewer.daemon.js", "--agent", "codex"];
    // Act
    await runReviewerDaemon(argv);

    // Assert
    expect(leafContainerBuilderMock).toHaveBeenCalledTimes(1);
    expect(buildMock).toHaveBeenCalledTimes(1);
    expect(buildMock).toHaveBeenCalledWith();
    expect(disposeMock).toHaveBeenCalledTimes(1);
    expect(pollingRunMock).toHaveBeenCalledWith(expect.objectContaining({
      processOptions: expect.objectContaining({ agentId: "codex" }),
    }));
    expect(JSON.parse(String(stdoutSpy.mock.calls[0][0]))).toMatchObject({ daemon: "reviewer", status: "idle", category: "waiting" });
  });

  it("runReviewerDaemon_pollingPending_keepsResourcesAliveUntilCompletion", async () => {
    // Arrange
    let entered!: () => void;
    let finish!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const pending = new Promise<void>(resolve => { finish = resolve; });
    pollingRunMock.mockImplementationOnce(async () => { entered(); await pending; });
    // Act
    const running = runReviewerDaemon(["node", "reviewer.daemon.js"]);
    await started;
    // Assert
    expect(disposeMock).not.toHaveBeenCalled();
    finish();
    await running;
    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  it("runReviewerDaemon_constructionFails_disposesAndPropagatesFailure", async () => {
    // Arrange
    const failure = new Error("build failed");
    buildMock.mockRejectedValueOnce(failure);
    // Act
    const running = runReviewerDaemon(["node", "reviewer.daemon.js"]);
    // Assert
    await expect(running).rejects.toBe(failure);
    expect(disposeMock).toHaveBeenCalledTimes(1);
    expect(pollingRunMock).not.toHaveBeenCalled();
  });

  it.each(["outside", "nested"] as const)("runReviewerDaemon_%sContext_routesCompiledBootstrapWithoutChangingBytes", async condition => {
    // Arrange
    const fixture = await DaemonBootstrapFixture.create();
    try {
      const cwd = fixture[condition];
      const before = await snapshot(cwd);
      const database = await fs.readFile(fixture.root.getProjectDbFile(fixture.project));
      // Act
      const result = await fixture.invoke("reviewer", cwd);
      // Assert
      expect({ status: result.status, error: result.status ? result.stderr : undefined }).toEqual({ status: 0 });
      expect(result.records).toEqual([{ compositionImported: true }, { root: fixture.root.getProjectDirectory(condition === "outside" ? fixture.outside : fixture.project) }]);
      expect(await snapshot(cwd)).toEqual(before);
      expect(await fs.readFile(fixture.root.getProjectDbFile(fixture.project))).toEqual(database);
    } finally { await fixture.dispose(); }
  });
});
