import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import type { ApplicationRoot } from "../../../../src/application/host/ApplicationRoot.js";
import { applicationRoot, applicationRootInHome } from "../../../fixtures/application-root.js";
import { LegacyInstallationMigrator } from "../../../../src/migration/LegacyInstallationMigrator.js";
import { CachedContextProject } from "../../../../src/infrastructure/host/ContextProject.js";

let temp: string;
let cwd: string;
let source: string;
let root: ApplicationRoot;
let migrator: LegacyInstallationMigrator;
beforeEach(async () => {
  temp = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-migrate-")));
  cwd = path.join(temp, "checkout");
  source = path.join(cwd, ".jumbo");
  root = applicationRoot(temp);
  migrator = new LegacyInstallationMigrator();
  await fs.outputFile(path.join(source, "settings.jsonc"), '{ // existing comments\n "project": {"id":"preserved-id"}, "custom":{"flag":true}}');
  await fs.outputJson(path.join(source, "events", "preserved-id", "000001.ProjectInitializedEvent.json"), { type: "ProjectInitializedEvent", aggregateId: "preserved-id" });
  await fs.outputFile(path.join(source, "logs", "history.log"), "old log");
  const database = new Database(path.join(source, "jumbo.db"));
  database.exec("CREATE TABLE fixture (id TEXT)");
  database.close();
  jest.spyOn(process, "cwd").mockReturnValue(cwd);
  jest.spyOn(ContextProjectPath, "get").mockReturnValue(cwd);
});
afterEach(async () => { jest.restoreAllMocks(); await fs.remove(temp); });

describe("legacy migration", () => {
  it("migrate_malformedSettings_rejectsWithoutPublishingStorage", async () => {
    // Arrange
    await fs.writeFile(path.join(source, "settings.jsonc"), "broken");
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/Invalid legacy settings/);
    expect(await fs.pathExists(root.getProjectDirectory(cwd))).toBe(false);
  });

  it("migrate_walBackedData_preservesArtifactsAndPublishesCompleteStorage", async () => {
    // Arrange
    const db = new Database(path.join(source, "jumbo.db"));
    db.pragma("journal_mode = WAL");
    db.exec("CREATE TABLE sentinel (value TEXT); INSERT INTO sentinel VALUES ('preserved')");
    const settingsBefore = await fs.readFile(path.join(source, "settings.jsonc"), "utf8");
    try {
      // Act
      const location = await migrator.migrate();
      // Assert
      const target = root.getProjectDirectory(cwd);
      expect(location).toBe(target);
      const copiedDb = new Database(root.getProjectDbFile(cwd), { readonly: true });
      try { expect(copiedDb.prepare("SELECT value FROM sentinel").get()).toEqual({ value: "preserved" }); }
      finally { copiedDb.close(); }
      expect(await fs.readJson(root.getProjectSettings(cwd))).toMatchObject({ project: { id: "preserved-id" }, connection: { backend: "local" }, custom: { flag: true } });
      expect(await fs.readFile(path.join(root.getProjectLogsDirectory(cwd), "history.log"), "utf8")).toBe("old log");
      expect(await fs.pathExists(path.join(target, "settings.jsonc"))).toBe(false);
      expect(await fs.readFile(path.join(source, "settings.jsonc"), "utf8")).toBe(settingsBefore);
      expect(location).toBe(root.getProjectDirectory(ContextProjectPath.get()));
    } finally { db.close(); }
  });

  it("migrate_linkedCheckout_requiresMainRootAndPublishesSharedStorage", async () => {
    // Arrange
    const git = (...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
    git("init");
    git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.com", "commit", "--allow-empty", "-m", "Initial");
    const linked = path.join(temp, "linked");
    git("worktree", "add", "--detach", linked);
    jest.mocked(process.cwd).mockReturnValue(linked);
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/main project root/);
    expect(await fs.pathExists(root.path)).toBe(false);
    jest.mocked(process.cwd).mockReturnValue(cwd);
    await migrator.migrate();
    jest.mocked(process.cwd).mockReturnValue(linked);
    expect((await fs.readJson(root.getProjectSettings(ContextProjectPath.get()))).project.id).toBe("preserved-id");
    expect(await fs.pathExists(root.getProjectDirectory(linked))).toBe(false);
  });

  it("migrate_directoryOnlyProjectWithoutGit_preservesIdentity", async () => {
    // Arrange
    jest.replaceProperty(process, "env", { ...process.env, PATH: temp, Path: temp });
    // Act
    const location = await migrator.migrate();
    // Assert
    expect(location).toBe(root.getProjectDirectory(cwd));
    expect((await fs.readJson(root.getProjectSettings(cwd))).project.id).toBe("preserved-id");
    expect(ContextProjectPath.get()).toBe(cwd);
    expect(await fs.pathExists(path.join(cwd, ".git"))).toBe(false);
  });

  it("migrate_missingSettings_recoversIdentityFromHistory", async () => {
    // Arrange
    await fs.remove(path.join(source, "settings.jsonc"));
    // Act
    await migrator.migrate();
    // Assert
    expect((await fs.readJson(root.getProjectSettings(cwd))).project.id).toBe("preserved-id");
  });

  it("migrate_mismatchedIdentity_rejectsWithoutAlteringSource", async () => {
    // Arrange
    await fs.writeJson(path.join(source, "settings.jsonc"), { project: { id: "different-id" } });
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/inconsistent/);
    expect(await fs.pathExists(root.getProjectDirectory(cwd))).toBe(false);
    expect((await fs.readJson(path.join(source, "settings.jsonc"))).project.id).toBe("different-id");
  });

  it("migrate_existingDestination_refusesOverwrite", async () => {
    // Arrange
    await migrator.migrate();
    await fs.outputFile(path.join(root.getProjectDirectory(cwd), "sentinel"), "new work");
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/destination already exists/);
    expect(await fs.readFile(path.join(root.getProjectDirectory(cwd), "sentinel"), "utf8")).toBe("new work");
  });

  it("migrate_publicationFails_removesStagedDirectory", async () => {
    // Arrange
    jest.spyOn(fs, "rename").mockImplementation(async () => { throw new Error("disk full"); });
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow("disk full");
    expect(await fs.pathExists(root.getProjectDirectory(cwd))).toBe(false);
    expect(await fs.pathExists(path.join(source, "settings.jsonc"))).toBe(true);
    expect(await fs.readdir(root.projectsDirectory)).toEqual([]);
  });

  it("migrate_invalidSettingsOrDatabase_rejectsWithoutPublishing", async () => {
    // Arrange
    await fs.writeFile(path.join(source, "settings.jsonc"), "{malformed");
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/Invalid legacy settings/);
    await fs.writeJson(path.join(source, "settings.jsonc"), { project: { id: "preserved-id" } });
    await fs.writeFile(path.join(source, "jumbo.db"), "corrupt database");
    await expect(migrator.migrate()).rejects.toBeDefined();
    expect(await fs.pathExists(root.getProjectDirectory(cwd))).toBe(false);
    expect(await fs.readFile(path.join(source, "jumbo.db"), "utf8")).toBe("corrupt database");
  });

  it("migrate_sourceChangesDuringCopy_rejectsInconsistentSnapshot", async () => {
    // Arrange
    const copyFile = fs.copyFile;
    jest.spyOn(fs, "copyFile").mockImplementationOnce(async (from, to) => {
      await copyFile(from, to);
      await fs.appendFile(path.join(source, "logs", "history.log"), " concurrent write");
    });
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/changed during migration/);
    expect(await fs.pathExists(root.getProjectDirectory(cwd))).toBe(false);
  });

  it("migrate_missingDatabase_refusesReplacementStore", async () => {
    // Arrange
    await fs.remove(path.join(source, "jumbo.db"));
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/database is missing/);
    expect(await fs.pathExists(root.path)).toBe(false);
  });

  it("migrate_lockHeldByAnotherMigration_preservesLock", async () => {
    // Arrange
    const lock = `${root.getProjectDirectory(cwd)}.migration-lock`;
    await fs.ensureDir(lock);
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toMatchObject({ code: "EEXIST" });
    expect(await fs.pathExists(lock)).toBe(true);
  });

  (process.platform === "win32" ? it.skip : it)("migrate_legacySymlink_rejectsWithoutFollowingOrChangingTarget", async () => {
    // Arrange
    const external = path.join(temp, "external");
    await fs.writeFile(external, "unchanged");
    await fs.symlink(external, path.join(source, "linked-file"));
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/symbolic links/);
    expect(await fs.readFile(external, "utf8")).toBe("unchanged");
    expect(await fs.pathExists(root.getProjectDirectory(cwd))).toBe(false);
  });

  (process.platform === "win32" ? it.skip : it)("migrate_applicationRootAliasesLegacyStorage_rejectsBeforePublication", async () => {
    // Arrange
    const alias = path.join(temp, "alias");
    await fs.symlink(source, alias);
    const aliasedRoot = applicationRootInHome(alias);
    const aliased = new LegacyInstallationMigrator();
    // Act
    const result = aliased.migrate();
    // Assert
    await expect(result).rejects.toThrow(/inside legacy storage/);
    expect(await fs.pathExists(aliasedRoot.path)).toBe(false);
  });

  it("migrate_homeApplicationRootWithoutLegacyData_reportsNoInstallation", async () => {
    // Arrange
    const homeRoot = applicationRootInHome(temp);
    await fs.ensureDir(homeRoot.path);
    jest.mocked(process.cwd).mockReturnValue(temp);
    jest.mocked(ContextProjectPath.get).mockReturnValue(temp);
    // Act
    const result = new LegacyInstallationMigrator().migrate();
    // Assert
    await expect(result).rejects.toThrow("No legacy Jumbo installation found");
  });

  it("migrate_nestedDirectory_requiresExactRoot", async () => {
    // Arrange
    await fs.ensureDir(path.join(cwd, "nested"));
    jest.mocked(process.cwd).mockReturnValue(path.join(cwd, "nested"));
    // Act
    const result = migrator.migrate();
    // Assert
    await expect(result).rejects.toThrow(/project root/);
  });
});
