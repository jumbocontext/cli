import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CompiledCliFixture, snapshot } from "../fixtures/compiled-cli.js";
import type { CliTrace } from "../fixtures/compiled-cli.js";
import fs from "fs-extra";
import Database from "better-sqlite3";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { CachedContextProject, ContextProject } from "../../src/infrastructure/host/ContextProject.js";
import { LeafContainerBuilder } from "../../src/infrastructure/host/LeafContainerBuilder.js";
import { applicationRoot, applicationEnvironment } from "../fixtures/application-root.js";

/** Composes exactly the features the relation-output fixture exercises. */
async function composeFixtureContainer() {
  return new LeafContainerBuilder()
    .withProjectInitFeature()
    .withAddGoalFeature()
    .withAddInvariantFeature()
    .withAddRelationFeature()
    .withGetRelationsFeature()
    .build();
}

type FixtureContainer = Awaited<ReturnType<typeof composeFixtureContainer>>;

describe("cli relation output", () => {
  let directory: string;
  let container: FixtureContainer;

  beforeEach(async () => {
    directory = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-cli-relations-")));
    applicationRoot(directory);
    jest.spyOn(process, "cwd").mockReturnValue(directory);
    jest.spyOn(CachedContextProject, "get").mockReturnValue(new ContextProject());
    container = await composeFixtureContainer();
    await container.initializeProjectController.handle({ projectRoot: directory, name: "Relation fixture", purpose: undefined, selectedAgentIds: [] });
  });

  afterEach(async () => {
    await container.dispose();
    jest.restoreAllMocks();
    await fs.remove(directory);
  });

  it.each(["text", "json"] as const)("run_relationReaddedWith%sFormat_createsFreshConnectionAndPreservesOutput", async format => {
    // Arrange
    const { goalId } = await container.addGoalController.handle({ title: "Repair context", objective: "Use current guidance", successCriteria: ["Current guidance connected"] });
    const { invariantId } = await container.addInvariantController.handle({ title: "Boundary", description: "Respect the application boundary" });
    const request = { fromEntityType: "goal" as const, fromEntityId: goalId, toEntityType: "invariant" as const, toEntityId: invariantId, relationType: "must-respect", description: "Original guidance", strength: "strong" as const };
    const original = await container.addRelationController.handle(request);
    await container.removeRelationController.handle(original);
    // Act
    const result = spawnSync(process.execPath, [path.resolve("dist/cli.js"), "relation", "add", "--from-type", "goal", "--from-id", goalId, "--to-type", "invariant", "--to-id", invariantId, "--type", request.relationType, "--description", "New guidance", "--format", format], {
      cwd: directory, encoding: "utf8", timeout: 20_000, env: applicationEnvironment(directory),
    });
    // Assert
    expect(result.error).toBeUndefined();
    expect({ status: result.status, error: result.status ? result.stderr : undefined }).toEqual({ status: 0 });
    const { relations } = await container.getRelationsController.handle({ entityType: "goal", entityId: goalId, status: "all" });
    const current = relations.find(relation => relation.fromEntityId === goalId && relation.toEntityId === invariantId && relation.relationType === request.relationType) ?? null;
    expect(current).toMatchObject({ status: "active", description: "New guidance", strength: null, version: 1 });
    expect(current!.relationId).not.toBe(original.relationId);
    if (format === "json") {
      expect(JSON.parse(result.stdout)).toEqual({ relationId: current!.relationId, from: `goal:${goalId}`, to: `invariant:${invariantId}`, relationType: request.relationType });
    } else {
      expect(result.stdout).toContain(current!.relationId);
    }
  });
});

function expectNoProjectServices(trace: CliTrace[]) {
  expect(trace.some(entry => /infrastructure\/host\/(LocalProjectDatabase|TuiBootstrap)\.js$/.test(entry.module ?? ""))).toBe(false);
}

describe("cli application-root protocol", () => {
  let fixture: CompiledCliFixture;
  beforeEach(async () => { fixture = await CompiledCliFixture.create(); });
  afterEach(async () => { await fixture?.dispose(); jest.restoreAllMocks(); });

  it.each([
    ["--help"], ["help"], ["goal", "--help"], ["goal", "start", "--help"], ["migrate", "--help"],
    ["--version"], ["-v"], ["version"], ["unknown"], ["goal", "start"],
    ["goal", "start", "--id", "x", "--unknown"], ["goal", "start", "--id", "x", "extra"],
  ])("run_parserOnlyArguments%j_doesNotResolveRootsOrConstructServices", async (...args) => {
    // Arrange
    const before = await snapshot(fixture.cwd);
    // Act
    const result = await fixture.invoke(fixture.cwd, args);
    // Assert
    expectNoProjectServices(result.trace);
    expect(result.trace.some(entry => entry.startupCall)).toBe(false);
    expect(await snapshot(fixture.cwd)).toEqual(before);
    expect(await fs.pathExists(fixture.root.path)).toBe(false);
  });

  it("run_uninitializedProjectCommand_composesLocalInitializationServices", async () => {
    // Arrange
    const args = ["session", "start"];
    // Act
    const result = await fixture.invoke(fixture.cwd, args);
    // Assert
    expect(result.status).toBe(0);
    expect(result.trace.some(entry => /\/LocalProjectDatabase\.js$.test(entry.module ?? ""))).toBe(true);
    expect(await fs.pathExists(fixture.root.getProjectDbFile(fixture.cwd))).toBe(true);
  });

  it("run_uninitializedBareInvocation_eagerlyComposesWithoutPlanning", async () => {
    // Arrange
    const args: string[] = [];
    // Act
    const result = await fixture.invoke(fixture.cwd, args);
    // Assert
    expect(result.status).toBe(0);
    expect(result.trace.some(entry => entry.initialized)).toBe(true);
    expect(result.trace.some(entry => entry.planned)).toBe(false);
    expect(result.trace.some(entry => /\/LocalProjectDatabase\.js$.test(entry.module ?? ""))).toBe(true);
    expect(await fs.pathExists(fixture.root.getProjectDbFile(fixture.cwd))).toBe(true);
    expect(await fs.readdir(fixture.cwd)).toEqual([]);
  });

  it("run_initializationWithoutBootstrapProjectRoot_rejectsBeforeStorage", async () => {
    // Arrange
    const args = ["project", "init", "--name", "Fixture", "--non-interactive", "--yolo"];
    // Act
    const initialized = await fixture.invoke(fixture.cwd, args);
    // Assert
    expect(initialized.status).toBe(1);
    expect(initialized.stderr).toContain("Accepted local command has no bootstrap project root");
    expect(await fs.pathExists(fixture.root.path)).toBe(false);
    expect(await fs.pathExists(path.join(fixture.cwd, ".jumbo"))).toBe(false);
  });

  it("run_directoryWithoutGit_createsStorageBeforeRejectingInitialization", async () => {
    // Arrange
    const directory = path.join(fixture.directory, "directory-only");
    await fs.ensureDir(directory);
    const noGit = { PATH: directory, Path: directory };
    // Act
    const launched = await fixture.invoke(directory, [], noGit);
    const initialized = await fixture.invoke(directory, ["project", "init", "--name", "Directory only", "--non-interactive", "--yolo"], noGit);
    // Assert
    expect(launched.status).toBe(0);
    expect(launched.trace.some(entry => entry.planned)).toBe(false);
    expect(await fs.pathExists(fixture.root.getProjectDbFile(directory))).toBe(true);
    expect(initialized.status).toBe(1);
    expect(initialized.stderr).toContain("Accepted local command has no bootstrap project root");
    expect(await fs.pathExists(fixture.root.getProjectSettings(directory))).toBe(true);
    expect(await fs.pathExists(path.join(directory, ".git"))).toBe(false);
  }, 60_000);

  it("run_linkedWorktreeInitializationWithoutBootstrapProjectRoot_rejectsWithoutFiles", async () => {
    // Arrange
    const main = path.join(fixture.directory, "git-main");
    const linked = path.join(fixture.directory, "git-linked");
    await fs.ensureDir(main);
    for (const args of [["init"], ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.com", "commit", "--allow-empty", "-m", "Initial"], ["worktree", "add", "--detach", linked]]) expect(spawnSync("git", args, { cwd: main }).status).toBe(0);
    // Act
    const result = await fixture.invoke(linked, ["project", "init", "--name", "Shared", "--non-interactive", "--yolo"]);
    // Assert
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Accepted local command has no bootstrap project root");
    expect(await fs.pathExists(fixture.root.getProjectSettings(main))).toBe(false);
    expect(await fs.pathExists(fixture.root.getProjectDirectory(linked))).toBe(false);
    expect(await fs.pathExists(path.join(linked, "JUMBO.md"))).toBe(false);
    expect(await fs.pathExists(path.join(main, "JUMBO.md"))).toBe(false);
  }, 60_000);

  it("run_remoteConfiguration_composesLocalInfrastructure", async () => {
    // Arrange
    const directory = path.join(fixture.directory, "remote-checkout");
    await fs.ensureDir(directory);
    await fs.outputJson(fixture.root.getProjectSettings(directory), { project: { id: "remote-id" }, connection: { backend: "remote" } });
    // Act
    const results = [await fixture.invoke(directory, ["session", "start"]), await fixture.invoke(directory, [])];
    // Assert
    for (const result of results) {
      expect(result.status).toBe(0);
      expect(result.trace.some(entry => /\/LocalProjectDatabase\.js$.test(entry.module ?? ""))).toBe(true);
    }
  });

  it("run_legacyArtifacts_blocksUntilExplicitCopyOnlyMigration", async () => {
    // Arrange
    const directory = path.join(fixture.directory, "legacy-checkout");
    const legacy = path.join(directory, ".jumbo");
    await fs.outputJson(path.join(legacy, "settings.jsonc"), { project: { id: "legacy-id" } });
    await fs.outputJson(path.join(legacy, "events", "legacy-id", "000001.ProjectInitializedEvent.json"), { type: "ProjectInitializedEvent", aggregateId: "legacy-id" });
    const database = new Database(path.join(legacy, "jumbo.db"));
    database.exec("CREATE TABLE sentinel (value TEXT); INSERT INTO sentinel VALUES ('preserved')");
    database.close();
    const before = await snapshot(legacy);
    // Act
    const blocked = [];
    for (const args of [["session", "start"], ["project", "init", "--name", "Oops", "--non-interactive", "--yolo"], []]) blocked.push(await fixture.invoke(directory, args));
    // Assert
    for (const result of blocked) {
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`Run \`jumbo migrate\` from ${directory}. This project's legacy Jumbo data has not been migrated to the application root.`);
      expect(result.stderr).not.toContain('"stack"');
      expect(result.stderr).not.toMatch(/\n\s+at /);
      expectNoProjectServices(result.trace);
    }
    expect(await snapshot(legacy)).toEqual(before);
    const migrated = await fixture.invoke(directory, ["migrate"]);
    expect(migrated.status).toBe(0);
    expectNoProjectServices(migrated.trace);
    expect(await snapshot(legacy)).toEqual(before);
    expect(await fs.pathExists(fixture.root.getProjectSettings(directory))).toBe(true);
    expect((await fixture.invoke(directory, ["session", "start"])).status).toBe(0);
  });
});
