/**
 * Tests for CursorConfigurer infrastructure implementation
 */

import fs from "fs-extra";
import * as path from "path";
import { CursorConfigurer } from "../../../../../../src/infrastructure/context/project/init/CursorConfigurer";
import { CursorRulesContent } from "../../../../../../src/domain/project/CursorRulesContent";
import os from "os";
import { jest } from "@jest/globals";

jest.setTimeout(30_000);

describe("CursorConfigurer", () => {
  let tmpDir: string;
  const configurer = new CursorConfigurer();

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-cursor-configurer-"));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("agent", () => {
    it("should have the correct agent identity", () => {
      expect(configurer.agent).toEqual({ id: "cursor", name: "Cursor" });
    });
  });

  describe("skillPlatforms", () => {
    it("should declare no skill platforms", () => {
      expect(configurer.skillPlatforms).toEqual([]);
    });
  });

  describe("configure()", () => {
    it("should create .cursor/rules/jumbo.mdc with alwaysApply frontmatter", async () => {
      await configurer.configure(tmpDir);

      const rulesPath = path.join(tmpDir, ".cursor", "rules", "jumbo.mdc");
      const exists = await fs.pathExists(rulesPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(rulesPath, "utf-8");
      expect(content).toContain("alwaysApply: true");
      expect(content).toContain("JUMBO.md");
      expect(content).toContain(CursorRulesContent.getSectionMarker());
    });

    it("should create .cursor/hooks.json with Cursor-compatible sessionStart hook only", async () => {
      await configurer.configure(tmpDir);

      const hooksPath = path.join(tmpDir, ".cursor", "hooks.json");
      const exists = await fs.pathExists(hooksPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(hooksPath, "utf-8");
      const hooks = JSON.parse(content);

      expect(hooks.version).toBe(1);
      expect(hooks.hooks.sessionStart).toBeDefined();
      expect(hooks.hooks.sessionStart[0].command).toBe("jumbo session start");
      expect(hooks.hooks.preCompact).toBeUndefined();
    });

    it("should not duplicate content if jumbo.mdc already has the section marker", async () => {
      await configurer.configure(tmpDir);
      await configurer.configure(tmpDir);

      const rulesPath = path.join(tmpDir, ".cursor", "rules", "jumbo.mdc");
      const content = await fs.readFile(rulesPath, "utf-8");
      const markerOccurrences = (content.match(/<!-- jumbo:cursor-rules -->/g) || []).length;
      expect(markerOccurrences).toBe(1);
    });

    it("should merge hooks into existing .cursor/hooks.json without duplicating", async () => {
      const hooksPath = path.join(tmpDir, ".cursor", "hooks.json");
      await fs.ensureDir(path.join(tmpDir, ".cursor"));
      const existingHooks = {
        version: 1,
        hooks: {
          sessionStart: [
            { command: "echo hello" },
          ],
        },
      };
      await fs.writeFile(hooksPath, JSON.stringify(existingHooks, null, 2), "utf-8");

      await configurer.configure(tmpDir);

      const content = await fs.readFile(hooksPath, "utf-8");
      const hooks = JSON.parse(content);
      expect(hooks.hooks.sessionStart.length).toBe(2);
      expect(hooks.hooks.preCompact).toBeUndefined();
    });

    it("should normalize legacy bash hook format and remove stale Jumbo preCompact hook", async () => {
      const hooksPath = path.join(tmpDir, ".cursor", "hooks.json");
      await fs.ensureDir(path.join(tmpDir, ".cursor"));
      const existingHooks = {
        version: 1,
        hooks: {
          sessionStart: [
            { type: "command", bash: "echo hello", cwd: ".", timeoutSec: 5 },
          ],
          preCompact: [
            { type: "command", bash: "jumbo work pause", cwd: ".", timeoutSec: 10 },
          ],
        },
      };
      await fs.writeFile(hooksPath, JSON.stringify(existingHooks, null, 2), "utf-8");

      await configurer.configure(tmpDir);

      const content = await fs.readFile(hooksPath, "utf-8");
      const hooks = JSON.parse(content);
      expect(hooks.hooks.sessionStart).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ command: "echo hello", timeout: 5 }),
          expect.objectContaining({ command: "jumbo session start" }),
        ])
      );
      expect(hooks.hooks.preCompact).toBeUndefined();
    });

    it("should handle errors gracefully without throwing", async () => {
      const invalidPath = path.join(tmpDir, "nonexistent", "deeply", "nested");
      await expect(configurer.configure(invalidPath)).resolves.not.toThrow();
    });
  });

  describe("repair()", () => {
    it("should create files if missing", async () => {
      await configurer.repair!(tmpDir);

      const rulesPath = path.join(tmpDir, ".cursor", "rules", "jumbo.mdc");
      expect(await fs.pathExists(rulesPath)).toBe(true);

      const hooksPath = path.join(tmpDir, ".cursor", "hooks.json");
      expect(await fs.pathExists(hooksPath)).toBe(true);
    });

    it("should replace stale content in jumbo.mdc", async () => {
      const rulesPath = path.join(tmpDir, ".cursor", "rules", "jumbo.mdc");
      await fs.ensureDir(path.join(tmpDir, ".cursor", "rules"));
      const staleContent = `---
alwaysApply: true
---

<!-- jumbo:cursor-rules -->

# Jumbo Context Management

Old stale instructions.
`;
      await fs.writeFile(rulesPath, staleContent, "utf-8");

      await configurer.repair!(tmpDir);

      const content = await fs.readFile(rulesPath, "utf-8");
      expect(content).toContain("JUMBO.md");
      expect(content).not.toContain("Old stale instructions.");
    });
  });

  describe("getPlannedFileChanges()", () => {
    it("should return planned changes for rules and hooks files", async () => {
      const changes = await configurer.getPlannedFileChanges(tmpDir);

      expect(changes).toEqual([
        {
          path: ".cursor/rules/jumbo.mdc",
          action: "create",
          description: "Add Jumbo instructions with alwaysApply frontmatter",
        },
        {
          path: ".cursor/hooks.json",
          action: "create",
          description: "Add Cursor-compatible sessionStart hook",
        },
      ]);
    });

    it("should report modify action when files already exist", async () => {
      await configurer.configure(tmpDir);

      const changes = await configurer.getPlannedFileChanges(tmpDir);

      expect(changes[0].action).toBe("modify");
      expect(changes[1].action).toBe("modify");
    });
  });
});
