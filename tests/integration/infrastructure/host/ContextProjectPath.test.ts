import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { execFileSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { ContextProject } from "../../../../src/infrastructure/host/ContextProject.js";
import { compiledProcess } from "../../../fixtures/compiled-process.js";

let temp: string;
let main: string;
let linked: string;
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

beforeEach(async () => {
  temp = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-paths-")));
  main = path.join(temp, "main checkout");
  linked = path.join(temp, "linked checkout");
  await fs.ensureDir(main);
  jest.spyOn(process, "cwd").mockReturnValue(main);
});

afterEach(async () => {
  jest.restoreAllMocks();
  await fs.remove(temp);
});

function repository() {
  git(main, "init");
  git(main, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.com", "commit", "--allow-empty", "-m", "Initial");
  git(main, "worktree", "add", "--detach", linked);
}

// Constructor-level cases do not reset the process-lifetime accessor.
function resolvePath(): string {
  return Reflect.construct(ContextProject, []).path;
}

describe("CachedContextProject", () => {
  it("get_directoryOutsideGit_returnsCanonicalCwd", async () => {
    // Arrange
    const nested = path.join(main, "nested");
    await fs.ensureDir(nested);
    jest.mocked(process.cwd).mockReturnValue(nested);
    // Act
    const projectPath = resolvePath();
    // Assert
    expect(projectPath).toBe(nested);
  });

  it("get_mainLinkedOrNestedCheckout_returnsMainCheckout", async () => {
    // Arrange
    repository();
    const mainNested = path.join(main, "src");
    const linkedNested = path.join(linked, "src");
    await fs.ensureDir(mainNested);
    await fs.ensureDir(linkedNested);
    const directories = [main, linked, mainNested, linkedNested];
    // Act
    const paths = directories.map(directory => {
      jest.mocked(process.cwd).mockReturnValue(directory);
      return resolvePath();
    });
    // Assert
    expect(paths).toEqual(directories.map(() => main));
  });

  (process.platform === "win32" ? it.skip : it)("get_symlinkedCheckout_returnsCanonicalMainCheckout", async () => {
    // Arrange
    repository();
    const alias = path.join(temp, "alias");
    await fs.symlink(linked, alias);
    jest.mocked(process.cwd).mockReturnValue(alias);
    // Act
    const projectPath = resolvePath();
    // Assert
    expect(projectPath).toBe(main);
  });

  it("get_directoryWithoutGitExecutable_returnsCwdWithoutSpawningGit", () => {
    // Arrange
    jest.replaceProperty(process, "env", { ...process.env, PATH: temp, Path: temp });
    // Act
    const projectPath = resolvePath();
    // Assert
    expect(projectPath).toBe(main);
  });

  it("get_checkoutWithInheritedGitOverrides_ignoresOverrides", () => {
    // Arrange
    repository();
    jest.mocked(process.cwd).mockReturnValue(linked);
    jest.replaceProperty(process, "env", { ...process.env, GIT_DIR: "/missing", GIT_WORK_TREE: "/missing", GIT_COMMON_DIR: "/missing", GIT_INDEX_FILE: "/missing" });
    // Act
    const projectPath = resolvePath();
    // Assert
    expect(projectPath).toBe(main);
  });

  it("get_checkoutWithoutGitExecutable_propagatesResolutionFailure", () => {
    // Arrange
    repository();
    jest.replaceProperty(process, "env", { ...process.env, PATH: temp, Path: temp });
    // Act
    const resolve = () => resolvePath();
    // Assert
    expect(resolve).toThrow();
  });

  it("get_emptyGitMarkerDirectory_returnsCwd", async () => {
    // Sandboxes such as Codex's workspace-write mode materialize an empty,
    // unusable .git directory; resolution must fall back to the cwd.
    // Arrange
    await fs.ensureDir(path.join(main, ".git"));
    // Act
    const projectPath = resolvePath();
    // Assert
    expect(projectPath).toBe(main);
  });

  it("get_bareRepositoryDirectory_returnsCwd", () => {
    // Arrange
    git(main, "init", "--bare");
    // Act
    const projectPath = resolvePath();
    // Assert
    expect(projectPath).toBe(main);
  });

  it("get_worktreeOfBareRepository_rejectsMissingMainWorkingTree", () => {
    // Arrange
    repository();
    const bare = path.join(temp, "bare.git");
    const checkout = path.join(temp, "bare-checkout");
    git(temp, "clone", "--bare", main, bare);
    git(bare, "worktree", "add", "--detach", checkout);
    jest.mocked(process.cwd).mockReturnValue(checkout);
    // Act
    const resolve = () => resolvePath();
    // Assert
    expect(resolve).toThrow(/no main working tree/);
  });

  it("get_sourceBoundary_doesNotReferenceProjectServices", async () => {
    // Arrange
    const source = await fs.readFile("src/infrastructure/host/ContextProjectPath.ts", "utf8");
    // Act
    const importsServices = /LegacyInstallationDetector|LegacyInstallationMigrator|LocalProjectDatabase/.test(source);
    // Assert
    expect(importsServices).toBe(false);
  });

  it("get_cwdChangesAfterFirstAccess_retainsFirstResolvedPath", () => {
    // Arrange
    const source = `
      // Arrange
      const original = process.cwd();
      // Act
      const first = ContextProject.path;
      process.chdir(path.dirname(original));
      const second = ContextProject.path;
      // Assert
      assert.equal(first, original);
      assert.equal(second, first);
    `;
    // Act
    const run = () => compiledProcess("infrastructure/host/ContextProjectPath.js", source);
    // Assert
    expect(run).not.toThrow();
  });
});
