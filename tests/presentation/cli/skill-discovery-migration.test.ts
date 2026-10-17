import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { spawnSync } from "node:child_process";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";

const compiledCli = path.resolve("dist", "cli.js");
const currentName = "jumbo-discover-commands";
const retiredName = "jumbo-command-discovery";
const currentPlatforms = [".agents/skills", ".claude/skills", ".vibe/skills"];
const platforms = [...currentPlatforms, ".codex/skills", ".gemini/skills"];

describe("compiled CLI discovery skill migration (run npm run build first)", () => {
  let root: string;

  beforeEach(async () => {
    expect(await fs.pathExists(compiledCli)).toBe(true);
    root = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-cli-discovery-"));
  });

  afterEach(async () => {
    if (root) await fs.remove(root);
  });

  function invoke(args: string[]) {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      HOME: root,
      XDG_CONFIG_HOME: path.join(root, ".config"),
      NO_COLOR: "1",
      JUMBO_TELEMETRY_DISABLED: "1",
    };
    delete env.FORCE_COLOR;
    delete env.JUMBO_FORMAT;
    const result = spawnSync(process.execPath, [compiledCli, ...args], {
      cwd: root,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    });
    if (result.error || result.status !== 0) {
      throw new Error(`${args.join(" ")}: ${result.error ?? result.stderr}\n${result.stdout}`);
    }
    return result.stdout;
  }

  async function seedRetiredSkill() {
    for (const platform of platforms) {
      await fs.outputFile(path.join(root, platform, retiredName, "SKILL.md"), "retired skill");
      await fs.outputFile(path.join(root, platform, retiredName, "references", "old.md"), "old reference");
    }
    for (const platform of currentPlatforms) {
      await fs.outputFile(path.join(root, platform, "user-skill", "SKILL.md"), "user-owned");
    }
  }

  async function verifyMigration() {
    const canonical = await fs.readFile(path.resolve("assets", "skills", currentName, "SKILL.md"), "utf8");
    for (const platform of platforms) {
      expect(await fs.pathExists(path.join(root, platform, retiredName))).toBe(false);
    }
    for (const platform of currentPlatforms) {
      expect(await fs.readFile(path.join(root, platform, currentName, "SKILL.md"), "utf8")).toBe(canonical);
      expect(await fs.readFile(path.join(root, platform, "user-skill", "SKILL.md"), "utf8")).toBe("user-owned");
    }
  }

  it("init removes retired skill directories, then evolve removes reintroduced copies and repairs the renamed skill", async () => {
    await seedRetiredSkill();
    // The adapter only routes to help; no static skill catalog supplies these commands.
    const rootHelp = invoke(["--help"]);
    expect(rootHelp).toMatch(/\bproject init\b/);
    const initHelp = invoke(["init", "--help"]);
    expect(initHelp).toContain("--non-interactive");
    invoke(["init", "--non-interactive", "--yolo", "--name", "Discovery migration"]);
    await verifyMigration();

    await seedRetiredSkill();
    for (const platform of currentPlatforms) {
      await fs.writeFile(path.join(root, platform, currentName, "SKILL.md"), "outdated");
    }
    expect(rootHelp).toMatch(/\bevolve\b/);
    expect(invoke(["evolve", "--help"])).toContain("--yes");
    invoke(["evolve", "--yes"]);
    await verifyMigration();
    invoke(["evolve", "--yes"]);
    await verifyMigration();
  }, 120_000);
});
