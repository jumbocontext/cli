/**
 * Tests for FsGitignoreProtocol infrastructure implementation
 */

import fs from "fs-extra";
import * as path from "path";
import { FsGitignoreProtocol } from "../../../../../../src/infrastructure/context/project/init/FsGitignoreProtocol";
import os from "os";

describe("FsGitignoreProtocol", () => {
  let tmpDir: string;
  let protocol: FsGitignoreProtocol;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-gitignore-"));
    protocol = new FsGitignoreProtocol();
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("ensureExclusions()", () => {
    it("should create .gitignore with both patterns when file does not exist", async () => {
      await protocol.ensureExclusions(tmpDir);

      const gitignorePath = path.join(tmpDir, ".gitignore");
      const exists = await fs.pathExists(gitignorePath);
      expect(exists).toBe(true);

      const content = await fs.readFile(gitignorePath, "utf-8");
      expect(content).toContain(".jumbo/");
      expect(content).toContain(".jumbo/jumbo.db");
    });

    it("should append both patterns when .gitignore exists but lacks them", async () => {
      const gitignorePath = path.join(tmpDir, ".gitignore");
      await fs.writeFile(gitignorePath, "node_modules/\ndist/\n", "utf-8");

      await protocol.ensureExclusions(tmpDir);

      const content = await fs.readFile(gitignorePath, "utf-8");
      expect(content).toContain("node_modules/");
      expect(content).toContain("dist/");
      expect(content).toContain(".jumbo/");
      expect(content).toContain(".jumbo/jumbo.db");
    });

    it("should not modify .gitignore when both patterns already present", async () => {
      const gitignorePath = path.join(tmpDir, ".gitignore");
      const originalContent = "node_modules/\n.jumbo/\n.jumbo/jumbo.db\n";
      await fs.writeFile(gitignorePath, originalContent, "utf-8");

      await protocol.ensureExclusions(tmpDir);

      const content = await fs.readFile(gitignorePath, "utf-8");
      expect(content).toBe(originalContent);
    });

    it("should preserve existing user patterns", async () => {
      const gitignorePath = path.join(tmpDir, ".gitignore");
      await fs.writeFile(gitignorePath, "*.log\n.env\nbuild/\n", "utf-8");

      await protocol.ensureExclusions(tmpDir);

      const content = await fs.readFile(gitignorePath, "utf-8");
      expect(content).toContain("*.log");
      expect(content).toContain(".env");
      expect(content).toContain("build/");
      expect(content).toContain(".jumbo/");
      expect(content).toContain(".jumbo/jumbo.db");
    });

    it("should append only the missing pattern when one already exists", async () => {
      const gitignorePath = path.join(tmpDir, ".gitignore");
      await fs.writeFile(gitignorePath, "node_modules/\n.jumbo/\n", "utf-8");

      await protocol.ensureExclusions(tmpDir);

      const content = await fs.readFile(gitignorePath, "utf-8");
      expect(content).toContain(".jumbo/jumbo.db");
      // .jumbo/ should appear only once (original)
      const jumboSlashCount = (content.match(/^\.jumbo\/$/gm) || []).length;
      expect(jumboSlashCount).toBe(1);
    });

    it("should leave negated patterns unchanged", async () => {
      const gitignorePath = path.join(tmpDir, ".gitignore");
      const originalContent = "!.jumbo/\n!.jumbo/jumbo.db\n";
      await fs.writeFile(gitignorePath, originalContent, "utf-8");

      await protocol.ensureExclusions(tmpDir);

      const content = await fs.readFile(gitignorePath, "utf-8");
      expect(content).toBe(originalContent);
    });

    it("should leave commented patterns unchanged", async () => {
      const gitignorePath = path.join(tmpDir, ".gitignore");
      const originalContent = "# .jumbo/\n# .jumbo/jumbo.db\n";
      await fs.writeFile(gitignorePath, originalContent, "utf-8");

      await protocol.ensureExclusions(tmpDir);

      const content = await fs.readFile(gitignorePath, "utf-8");
      expect(content).toBe(originalContent);
    });
  });

  describe("getPlannedFileChanges()", () => {
    it("should return create action when .gitignore does not exist", async () => {
      const changes = await protocol.getPlannedFileChanges(tmpDir);

      expect(changes).toHaveLength(1);
      expect(changes[0].path).toBe(".gitignore");
      expect(changes[0].action).toBe("create");
    });

    it("should return modify action when .gitignore exists but lacks patterns", async () => {
      const gitignorePath = path.join(tmpDir, ".gitignore");
      await fs.writeFile(gitignorePath, "node_modules/\n", "utf-8");

      const changes = await protocol.getPlannedFileChanges(tmpDir);

      expect(changes).toHaveLength(1);
      expect(changes[0].path).toBe(".gitignore");
      expect(changes[0].action).toBe("modify");
    });

    it("should return empty array when both patterns already present", async () => {
      const gitignorePath = path.join(tmpDir, ".gitignore");
      await fs.writeFile(gitignorePath, ".jumbo/\n.jumbo/jumbo.db\n", "utf-8");

      const changes = await protocol.getPlannedFileChanges(tmpDir);

      expect(changes).toHaveLength(0);
    });
  });
});
