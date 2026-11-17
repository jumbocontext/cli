import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { CachedContextProject } from "../../../../src/infrastructure/host/ContextProject.js";
import { LeafContainerBuilder } from "../../../../src/infrastructure/host/LeafContainerBuilder.js";
import { SubprocessManager } from "../../../../src/presentation/tui/daemon-subprocesses/SubprocessManager.js";
import type { WorkerDaemonName } from "../../../../src/application/daemons/WorkerDaemonCatalog.js";
import type { DaemonEventSnapshot } from "../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";
import { GoalStatus } from "../../../../src/domain/goals/Constants.js";
import { applicationRoot, applicationEnvironment } from "../../../fixtures/application-root.js";

jest.setTimeout(90_000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const COMPILED_CONTROLLER = path.join(
  PROJECT_ROOT,
  "dist",
  "infrastructure",
  "daemons",
  "NodeWorkerDaemonProcessController.js",
);
const COMPILED_CLI = path.join(PROJECT_ROOT, "dist", "cli.js");
const TEST_HOST_SESSION_ID = "jumbo-worker-daemon-production-integration";

let workspaceRoot: string;
let originalPath: string | undefined;
let originalPathUpper: string | undefined;
let fakeAgentScript: string;
let fakeAgentBin: string;
let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

describe("production worker daemons through TUI process wiring", () => {
  beforeAll(async () => {
    if (!(await fs.pathExists(COMPILED_CONTROLLER)) || !(await fs.pathExists(COMPILED_CLI))) {
      throw new Error("Compiled daemon artifacts missing. Run `npm run build` before this integration suite.");
    }

    workspaceRoot = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-worker-daemons-")),
    );
    fakeAgentScript = await writeFakeAgent(workspaceRoot);

    fakeAgentBin = path.join(workspaceRoot, "fake-agent-bin");
    await writeFakeAgentLaunchers(fakeAgentBin, fakeAgentScript);

    originalPath = process.env.Path;
    originalPathUpper = process.env.PATH;
    const inheritedPath = originalPath ?? originalPathUpper ?? "";
    process.env.Path = `${fakeAgentBin}${path.delimiter}${inheritedPath}`;
    process.env.PATH = `${fakeAgentBin}${path.delimiter}${inheritedPath}`;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (originalPath === undefined) delete process.env.Path;
    else process.env.Path = originalPath;
    if (originalPathUpper === undefined) delete process.env.PATH;
    else process.env.PATH = originalPathUpper;

    if (workspaceRoot !== undefined) {
      await removeIfAvailable(workspaceRoot);
    }
  });

  it.each([
    ["refiner", GoalStatus.REFINED, "completed"],
    ["reviewer", GoalStatus.QUALIFIED, "completed"],
    ["codifier", GoalStatus.DONE, "completed"],
  ] as const)(
    "spawn_successful%sDaemon_updatesGoalTo%sThroughRealProcessController",
    async (daemon, expectedStatus, expectedEventStatus) => {
      // Arrange
      const fixture = await createFixtureProject(`${daemon}-success`);
      const goalId = await prepareGoal(fixture.container, daemon);
      const manager = await createProductionManager();
      const previousCwd = process.cwd();
      process.chdir(fixture.projectRoot);
      try {
        // Act
        await manager.spawn(daemon, { agentId: "vibe", maxRetries: 1, pollIntervalMs: 10_000 });
        const event = await waitForDaemonEvent(manager, daemon, expectedEventStatus);
        // Assert
        expect(event).toEqual(expect.objectContaining({
          daemon,
          goalId,
          status: expectedEventStatus,
          category: expectedEventStatus,
        }));
        expect(manager.getStatus(daemon).events).toEqual(expect.arrayContaining([
          expect.objectContaining({ category: "polling", phase: "polling" }),
          expect.objectContaining({ category: "selection", goalId }),
          expect.objectContaining({ source: "agent", category: "model-output", goalId }),
        ]));
        expect((await fixture.container.goalStatusReader.findAll()).find(goal => goal.goalId === goalId)?.status).toBe(expectedStatus);
      } finally {
        await manager.terminate(daemon);
        process.chdir(previousCwd);
        await fixture.builder.dispose();
      }
    },
  );

  it.each([
    ["refiner", "exhausted"],
    ["reviewer", "exhausted"],
    ["codifier", "exhausted"],
  ] as const)(
    "spawn_failing%sDaemon_reportsDeterministicAgentFailure",
    async (daemon, expectedEventStatus) => {
      // Arrange
      const fixture = await createFixtureProject(`${daemon}-failure`);
      const goalId = await prepareGoal(fixture.container, daemon);
      const manager = await createProductionManager();
      const previousCwd = process.cwd();
      process.chdir(fixture.projectRoot);
      try {
        // Act
        await manager.spawn(daemon, { agentId: "antigravity", maxRetries: 1, pollIntervalMs: 10_000 });
        const event = await waitForDaemonEvent(manager, daemon, expectedEventStatus);
        // Assert
        expect(event).toEqual(expect.objectContaining({
          daemon,
          goalId,
          status: expectedEventStatus,
          category: expectedEventStatus,
          exitCode: 1,
        }));
        expect(manager.getStatus(daemon).events).toEqual(expect.arrayContaining([
          expect.objectContaining({ source: "agent", category: "agent-stderr", goalId }),
        ]));
      } finally {
        await manager.terminate(daemon);
        process.chdir(previousCwd);
        await fixture.builder.dispose();
      }
    },
  );
});

async function createProductionManager(): Promise<SubprocessManager> {
  const imported = await import(pathToFileURL(COMPILED_CONTROLLER).href);
  const inheritedPath = originalPath ?? originalPathUpper ?? "";
  return new SubprocessManager(new imported.NodeWorkerDaemonProcessController({
    ...applicationEnvironment(workspaceRoot),
    Path: `${fakeAgentBin}${path.delimiter}${inheritedPath}`,
    PATH: `${fakeAgentBin}${path.delimiter}${inheritedPath}`,
    JUMBO_FAKE_AGENT_CLI: COMPILED_CLI,
    TERM_SESSION_ID: TEST_HOST_SESSION_ID,
    JUMBO_AGENT_COMMAND_VIBE: process.execPath,
    JUMBO_AGENT_ARGS_VIBE: JSON.stringify([
      fakeAgentScript,
      "--fake-mode",
      "success",
    ]),
    JUMBO_AGENT_COMMAND_ANTIGRAVITY: process.execPath,
    JUMBO_AGENT_ARGS_ANTIGRAVITY: JSON.stringify([
      fakeAgentScript,
      "--fake-mode",
      "failure",
    ]),
  }));
}

type FixtureContainer = Awaited<ReturnType<LeafContainerBuilder["build"]>>;

async function createFixtureProject(name: string): Promise<{
  readonly projectRoot: string;
  readonly builder: LeafContainerBuilder;
  readonly container: FixtureContainer;
}> {
  const projectRootPath = path.join(workspaceRoot, name);
  await fs.mkdirp(projectRootPath);
  const projectRoot = await fs.realpath(projectRootPath);
  const builder = new LeafContainerBuilder()
    .withProjectInitFeature()
    .withAddGoalFeature()
    .withRefineGoalFeature()
    .withCommitGoalFeature()
    .withStartGoalFeature()
    .withSubmitGoalFeature()
    .withReviewGoalFeature()
    .withQualifyGoalFeature()
    .withGoalStatusReaderFeature();
  const previousCwd = process.cwd();
  process.chdir(projectRoot);
  try {
    applicationRoot(workspaceRoot);
    jest.spyOn(ContextProjectPath, "get").mockReturnValue(projectRoot);
    const container = await builder.build();
    await container.initializeProjectController.handle({ projectRoot, name, purpose: undefined, selectedAgentIds: [] });
    return { projectRoot, builder, container };
  } finally {
    process.chdir(previousCwd);
  }
}

async function prepareGoal(
  container: FixtureContainer,
  daemon: WorkerDaemonName,
): Promise<string> {
  const { goalId } = await container.addGoalController.handle({
    title: `${daemon} daemon fixture`,
    objective: `Exercise ${daemon} daemon fixture`,
    successCriteria: ["Daemon fixture completes"],
  });

  if (daemon === "refiner") {
    return goalId;
  }

  await container.refineGoalController.handle({ goalId });
  await container.commitGoalController.handle({ goalId });
  await container.startGoalController.handle({ goalId });
  await container.submitGoalController.handle({ goalId });

  if (daemon === "reviewer") {
    return goalId;
  }

  await container.reviewGoalController.handle({ goalId });
  await container.qualifyGoalController.handle({ goalId });
  return goalId;
}

async function waitForDaemonEvent(
  manager: SubprocessManager,
  daemon: WorkerDaemonName,
  status: string,
): Promise<DaemonEventSnapshot> {
  const deadline = Date.now() + 45_000;
  let lastSnapshot = manager.getStatus(daemon);
  while (Date.now() < deadline) {
    const snapshot = manager.getStatus(daemon);
    lastSnapshot = snapshot;
    const event = snapshot.events.find((candidate) => candidate.status === status);
    if (event !== undefined) {
      return event;
    }

    const failed = snapshot.events.find((candidate) => candidate.status === "failed");
    if (failed !== undefined) {
      throw new Error(`Daemon ${daemon} failed before ${status}: ${failed.errorMessage ?? failed.message ?? "unknown error"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(
    `Timed out waiting for ${daemon} event ${status}. Snapshot: ${JSON.stringify({
      status: lastSnapshot.status,
      stderr: lastSnapshot.stderr,
      events: lastSnapshot.events,
      exitCode: lastSnapshot.exitCode,
      exitSignal: lastSnapshot.exitSignal,
    })}`,
  );
}

async function writeFakeAgent(directory: string): Promise<string> {
  const scriptPath = path.join(directory, "fake-agent.js");
  await fs.writeFile(scriptPath, FAKE_AGENT_SCRIPT, "utf8");
  return scriptPath;
}

async function writeFakeAgentLaunchers(directory: string, scriptPath: string): Promise<void> {
  await fs.mkdirp(directory);
  await Promise.all([
    writeFakeAgentLauncher(directory, "vibe", scriptPath, "success"),
    writeFakeAgentLauncher(directory, "antigravity", scriptPath, "failure"),
  ]);
}

async function writeFakeAgentLauncher(
  directory: string,
  agentId: string,
  scriptPath: string,
  mode: "success" | "failure",
): Promise<void> {
  if (process.platform === "win32") {
    const launcherPath = path.join(directory, `${agentId}.cmd`);
    await fs.writeFile(
      launcherPath,
      `@echo off\r\n"${process.execPath}" "${scriptPath}" --fake-mode ${mode} %*\r\nexit /b %errorlevel%\r\n`,
      "utf8",
    );
    return;
  }

  const launcherPath = path.join(directory, agentId);
  await fs.writeFile(
    launcherPath,
    `#!/bin/sh\nexec "${process.execPath}" "${scriptPath}" --fake-mode ${mode} "$@"\n`,
    "utf8",
  );
  await fs.chmod(launcherPath, 0o755);
}

async function removeIfAvailable(target: string): Promise<void> {
  await fs.remove(target);
}

const FAKE_AGENT_SCRIPT = String.raw`
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const modeIndex = process.argv.indexOf("--fake-mode");
const mode = modeIndex === -1 ? "success" : process.argv[modeIndex + 1];
const cli = process.env.JUMBO_FAKE_AGENT_CLI;
const prompt = process.argv
  .filter((_, index) => index !== modeIndex && index !== modeIndex + 1)
  .slice(2)
  .join(" ");

fs.writeSync(process.stdout.fd, "fake agent activity: received prompt\n");

if (mode === "failure") {
  fs.writeSync(process.stderr.fd, "fake agent failure\n");
  process.exit(1);
}

const command = findCommand(prompt);
if (!command) {
  fs.writeSync(process.stderr.fd, "fake agent could not find a Jumbo completion command\n");
  process.exit(1);
}

const result = spawnSync(process.execPath, [cli, ...command], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (result.stdout) {
  fs.writeSync(process.stdout.fd, result.stdout);
}
if (result.stderr) {
  fs.writeSync(process.stderr.fd, result.stderr);
}

process.exit(result.status === null ? 1 : result.status);

function findCommand(prompt) {
  const commit = /jumbo goal commit --id ([^\s]+)/.exec(prompt);
  if (commit) return ["goal", "commit", "--id", commit[1]];

  const approve = /jumbo goal approve --id ([^\s]+)/.exec(prompt);
  if (approve) return ["goal", "approve", "--id", approve[1]];

  const close = /jumbo goal close --id ([^\s]+)/.exec(prompt);
  if (close) return ["goal", "close", "--id", close[1]];

  return null;
}
`;
