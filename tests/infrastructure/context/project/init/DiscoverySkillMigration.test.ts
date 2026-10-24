import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { parse } from "yaml";
import { AgentFileProtocol } from "../../../../../src/infrastructure/context/project/init/AgentFileProtocol.js";

const currentName = "jumbo-discover-commands";
const retiredName = "jumbo-command-discovery";
const canonicalPath = path.resolve("assets", "skills", currentName, "SKILL.md");
const currentPlatforms = [".agents/skills", ".claude/skills", ".vibe/skills"];
const platforms = [...currentPlatforms, ".codex/skills", ".gemini/skills"];
const operations = ["ensureAgentConfigurations", "repairAgentConfigurations"] as const;

describe("discovery skill contract", () => {
  it("is a minimal live-help adapter within the utf8-bytes-div-4-v1 budget", async () => {
    const content = await fs.readFile(canonicalPath, "utf8");
    const [, frontMatter, body] = content.split(/^---\s*$/m);
    expect(parse(frontMatter)).toMatchObject({ name: currentName, description: expect.any(String) });
    expect(Math.ceil(Buffer.byteLength(content, "utf8") / 4)).toBeLessThanOrEqual(90);
    // Only root and selected help invocations belong in this adapter, not a catalog.
    expect([...body.matchAll(/`([^`]+)`/g)].map(match => match[1])).toEqual([
      "jumbo --help", "jumbo <command> --help",
    ]);
    expect(body).toMatch(/live help is authoritative/i);
    expect(body).toMatch(/do not use static command or option catalogs/i);
    expect(await fs.pathExists(path.resolve("assets", "skills", retiredName))).toBe(false);
  });
});

describe.each(operations)("%s discovery skill migration", operation => {
  let root: string;
  let templateRoot: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-discovery-migration-"));
    templateRoot = path.join(root, "templates");
    await fs.copy(canonicalPath, path.join(templateRoot, currentName, "SKILL.md"));
    for (const platform of platforms) {
      await fs.outputFile(path.join(root, platform, retiredName, "SKILL.md"), "retired");
      await fs.outputFile(path.join(root, platform, retiredName, "references", "old.md"), "retired reference");
      await fs.outputFile(path.join(root, platform, "user-skill", "SKILL.md"), "user-owned");
    }
  });

  afterEach(async () => {
    await fs.remove(root);
  });

  it("removes retired directories across platforms even with only Codex selected, and is idempotent", async () => {
    const protocol = new AgentFileProtocol(templateRoot);
    await protocol[operation](root, ["codex"]);
    await protocol[operation](root, ["codex"]);

    for (const platform of platforms) {
      expect(await fs.pathExists(path.join(root, platform, retiredName))).toBe(false);
      expect(await fs.readFile(path.join(root, platform, "user-skill", "SKILL.md"), "utf8")).toBe("user-owned");
    }
    expect(await fs.readFile(path.join(root, ".agents/skills", currentName, "SKILL.md"), "utf8"))
      .toBe(await fs.readFile(canonicalPath, "utf8"));
    for (const platform of currentPlatforms.slice(1)) {
      expect(await fs.pathExists(path.join(root, platform, currentName))).toBe(false);
    }
  });

  it("cleans up even when the template directory is absent", async () => {
    await fs.remove(templateRoot);
    await new AgentFileProtocol(templateRoot)[operation](root, ["codex"]);
    for (const platform of platforms) {
      expect(await fs.pathExists(path.join(root, platform, retiredName))).toBe(false);
    }
  });
});

describe("canonical discovery skill distribution", () => {
  it("installs and repairs byte-identical templates on every current platform", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-discovery-install-"));
    try {
      const protocol = new AgentFileProtocol();
      await protocol.ensureAgentConfigurations(root);
      const canonical = await fs.readFile(canonicalPath, "utf8");
      for (const platform of currentPlatforms) {
        const destination = path.join(root, platform, currentName, "SKILL.md");
        expect(await fs.readFile(destination, "utf8")).toBe(canonical);
        await fs.writeFile(destination, "outdated");
      }
      await protocol.repairAgentConfigurations(root);
      for (const platform of currentPlatforms) {
        expect(await fs.readFile(path.join(root, platform, currentName, "SKILL.md"), "utf8")).toBe(canonical);
      }
    } finally {
      await fs.remove(root);
    }
  });
});
