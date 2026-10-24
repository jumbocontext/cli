import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { DeprecatedFileCleaner } from "../../../../../src/infrastructure/context/project/maintenance/DeprecatedFileCleaner.js";
import { DEPRECATED_MANAGED_PATHS } from "../../../../../src/infrastructure/context/project/maintenance/DeprecatedManagedPaths.js";

describe("DeprecatedFileCleaner", () => {
  let fixture: string;
  let project: string;

  beforeEach(async () => {
    fixture = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-deprecated-files-"));
    project = path.join(fixture, "project");
    await fs.ensureDir(project);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fs.remove(fixture);
  });

  it("supports additional files and directories through data without changing orchestration", async () => {
    const retiredPaths = ["old-config.json", "old-hooks"];
    await fs.outputJson(path.join(project, retiredPaths[0]), { retired: true });
    await fs.outputFile(path.join(project, retiredPaths[1], "nested", "hook.js"), "old hook");
    const preservedPath = path.join(project, "current-config.json");
    await fs.outputJson(preservedPath, { active: true });

    const cleaner = new DeprecatedFileCleaner(retiredPaths);
    await cleaner.clean(project);
    await cleaner.clean(project);

    for (const retiredPath of retiredPaths) {
      expect(await fs.pathExists(path.join(project, retiredPath))).toBe(false);
    }
    expect(await fs.readJson(preservedPath)).toEqual({ active: true });
  });

  it("uses the centralized retirement list by default", async () => {
    expect(DEPRECATED_MANAGED_PATHS.length).toBeGreaterThan(0);
    expect(new Set(DEPRECATED_MANAGED_PATHS).size).toBe(DEPRECATED_MANAGED_PATHS.length);
    for (const retiredPath of DEPRECATED_MANAGED_PATHS) {
      await fs.outputFile(path.join(project, retiredPath, "SKILL.md"), "retired");
    }

    await new DeprecatedFileCleaner().clean(project);

    for (const retiredPath of DEPRECATED_MANAGED_PATHS) {
      expect(await fs.pathExists(path.join(project, retiredPath))).toBe(false);
    }
  });

  it("does not create missing project directories", async () => {
    const missingProject = path.join(fixture, "missing");
    await new DeprecatedFileCleaner(["missing-file", "missing-directory"]).clean(missingProject);
    expect(await fs.pathExists(missingProject)).toBe(false);
  });

  it("rejects paths outside the project and the project root, warns, and continues cleanup", async () => {
    const outsideFile = path.join(fixture, "outside.json");
    const preservedFile = path.join(project, "keep.json");
    await fs.outputJson(outsideFile, { outside: true });
    await fs.outputJson(preservedFile, { active: true });
    await fs.outputFile(path.join(project, "retired.json"), "retired");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const unsafePaths = ["", ".", "..", "../outside.json", outsideFile];

    await new DeprecatedFileCleaner([...unsafePaths, "retired.json"]).clean(project);

    expect(warn).toHaveBeenCalledTimes(unsafePaths.length);
    expect(await fs.readJson(outsideFile)).toEqual({ outside: true });
    expect(await fs.readJson(preservedFile)).toEqual({ active: true });
    expect(await fs.pathExists(path.join(project, "retired.json"))).toBe(false);
  });
});
