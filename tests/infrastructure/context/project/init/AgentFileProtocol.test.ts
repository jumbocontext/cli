/**
 * Tests for AgentFileProtocol infrastructure implementation
 */

import fs from "fs-extra";
import * as path from "path";
import { spawnSync } from "node:child_process";
import { AgentFileProtocol } from "../../../../../src/infrastructure/context/project/init/AgentFileProtocol";
import { JumboMdContent } from "../../../../../src/domain/project/JumboMdContent";
import { AgentsMdContent } from "../../../../../src/domain/project/AgentsMdContent";
import { AgentFileReferenceContent } from "../../../../../src/domain/project/AgentFileReferenceContent";
import { CopilotInstructionsContent } from "../../../../../src/domain/project/CopilotInstructionsContent";
import { AgentFileAssetContent } from "../../../../../src/domain/project/AgentFileAssetContent";
import os from "os";
import { jest } from "@jest/globals";

jest.setTimeout(30_000);

describe("AgentFileProtocol", () => {
  let tmpDir: string;
  let protocol: AgentFileProtocol;
  const skillPlatforms = [".agents/skills", ".claude/skills", ".vibe/skills"];

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "test-agent-files-"));
    protocol = new AgentFileProtocol(path.join(tmpDir, "assets", "skills"));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("getAvailableAgents()", () => {
    it("should return the configured agent list derived from configurers", () => {
      expect(protocol.getAvailableAgents()).toEqual([
        { id: "claude", name: "Claude" },
        { id: "antigravity", name: "Antigravity" },
        { id: "copilot", name: "Copilot" },
        { id: "vibe", name: "Vibe" },
        { id: "codex", name: "Codex" },
        { id: "cursor", name: "Cursor" },
        { id: "opencode", name: "OpenCode" },
      ]);
    });
  });

  describe("ensureJumboMd()", () => {
    it("should create JUMBO.md if it doesn't exist", async () => {
      await protocol.ensureJumboMd(tmpDir);

      const jumboMdPath = path.join(tmpDir, "JUMBO.md");
      const exists = await fs.pathExists(jumboMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(jumboMdPath, "utf-8");
      expect(content).toContain("# JUMBO.md");
      expect(content).toContain(JumboMdContent.getCurrentSectionMarker());
      expect(content).toContain("jumbo session start");
      expect(content).not.toContain("jumbo goal refine --help");
      expect(content).not.toContain("### Available Commands");
    });

    it("should create JUMBO.md from the canonical managed asset", async () => {
      await protocol.ensureJumboMd(tmpDir);

      const content = await fs.readFile(path.join(tmpDir, "JUMBO.md"), "utf-8");
      expect(content).toBe(AgentFileAssetContent.readMarkdown("JUMBO.md"));
    });

    it("should replace outdated Jumbo section with current version", async () => {
      const jumboMdPath = path.join(tmpDir, "JUMBO.md");
      const currentMarker = JumboMdContent.getCurrentSectionMarker();
      const outdatedContent = `# JUMBO.md\n\n${currentMarker}\n\nOld outdated instructions.\n`;
      await fs.writeFile(jumboMdPath, outdatedContent, "utf-8");

      await protocol.ensureJumboMd(tmpDir);

      const content = await fs.readFile(jumboMdPath, "utf-8");
      expect(content).toContain(JumboMdContent.getJumboSection());
      expect(content).not.toContain("Old outdated instructions.");
    });

    it("should append Jumbo section if JUMBO.md exists without it", async () => {
      const jumboMdPath = path.join(tmpDir, "JUMBO.md");
      await fs.writeFile(jumboMdPath, "# Custom JUMBO.md\n\nExisting content.", "utf-8");

      await protocol.ensureJumboMd(tmpDir);

      const content = await fs.readFile(jumboMdPath, "utf-8");
      expect(content).toContain("Existing content.");
      expect(content).toContain(JumboMdContent.getCurrentSectionMarker());
    });

    it("should handle errors gracefully without throwing", async () => {
      const invalidPath = path.join(tmpDir, "nonexistent", "deeply", "nested");
      await expect(protocol.ensureJumboMd(invalidPath)).resolves.not.toThrow();
    });
  });

  describe("ensureAgentsMd()", () => {
    it("should create AGENTS.md with thin reference if it doesn't exist", async () => {
      await protocol.ensureAgentsMd(tmpDir);

      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const exists = await fs.pathExists(agentsMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain("# AGENTS.md");
      expect(content).toContain("See JUMBO.md and follow all instructions.");
      expect(content).toContain(AgentsMdContent.getCurrentJumboSectionMarker());
    });

    it("should append thin reference section if AGENTS.md exists without it", async () => {
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      await fs.writeFile(
        agentsMdPath,
        "# AI Agent Instructions\n\nExisting content here.",
        "utf-8"
      );

      await protocol.ensureAgentsMd(tmpDir);

      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain("Existing content here.");
      expect(content).toContain("See JUMBO.md and follow all instructions.");
    });

    it("should replace outdated Jumbo section with thin reference", async () => {
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
      const outdatedContent = `# Agents.md\n\n${currentMarker}\n\nDear Agent,\n\nOld verbose instructions.\n`;
      await fs.writeFile(agentsMdPath, outdatedContent, "utf-8");

      await protocol.ensureAgentsMd(tmpDir);

      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain("See JUMBO.md and follow all instructions.");
      expect(content).not.toContain("Dear Agent,");
      expect(content).not.toContain("Old verbose instructions.");
    });

    it("should replace legacy Jumbo section with thin reference", async () => {
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const legacyMarker = AgentsMdContent.getLegacyJumboSectionMarkers()[0];
      const legacyContent = `# Agents.md\n\n${legacyMarker}\n\nLegacy instructions.\n`;
      await fs.writeFile(agentsMdPath, legacyContent, "utf-8");

      await protocol.ensureAgentsMd(tmpDir);

      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain("See JUMBO.md and follow all instructions.");
      expect(content).not.toContain("Legacy instructions.");
      expect(content).not.toContain(legacyMarker);
    });

    it("should preserve non-Jumbo content when replacing", async () => {
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
      const content = `# Agents.md\n\n## My Custom Section\n\nKeep this.\n\n${currentMarker}\n\nOld.\n`;
      await fs.writeFile(agentsMdPath, content, "utf-8");

      await protocol.ensureAgentsMd(tmpDir);

      const result = await fs.readFile(agentsMdPath, "utf-8");
      expect(result).toContain("My Custom Section");
      expect(result).toContain("Keep this.");
      expect(result).toContain("See JUMBO.md and follow all instructions.");
    });

    it("should handle errors gracefully without throwing", async () => {
      const invalidPath = path.join(tmpDir, "nonexistent", "deeply", "nested");
      await expect(protocol.ensureAgentsMd(invalidPath)).resolves.not.toThrow();
    });
  });

  describe("ensureAgentConfigurations()", () => {
    it("should only configure the selected agents and their skill directories", async () => {
      const templateSkillPath = path.join(tmpDir, "assets", "skills", "my-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# My Skill\n", "utf-8");

      await protocol.ensureAgentConfigurations(tmpDir, ["claude", "copilot"]);

      expect(await fs.pathExists(path.join(tmpDir, "CLAUDE.md"))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, ".claude", "settings.json"))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, ".github", "copilot-instructions.md"))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, ".github", "hooks", "hooks.json"))).toBe(true);

      expect(await fs.pathExists(path.join(tmpDir, "GEMINI.md"))).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, ".agents", "hooks.json"))).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, ".gemini", "settings.json"))).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, ".opencode", "plugins", "jumbo.js"))).toBe(false);

      expect(await fs.pathExists(path.join(tmpDir, ".claude", "skills", "my-skill", "SKILL.md"))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, ".agents", "skills", "my-skill", "SKILL.md"))).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, ".vibe", "skills", "my-skill", "SKILL.md"))).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, ".gemini", "skills", "my-skill", "SKILL.md"))).toBe(false);
    });

    it("should install skills from template root outside project root", async () => {
      const externalTemplateRoot = await fs.mkdtemp(path.join(os.tmpdir(), "external-template-skills-"));
      protocol = new AgentFileProtocol(externalTemplateRoot);

      const externalSkillPath = path.join(externalTemplateRoot, "external-skill");
      await fs.ensureDir(externalSkillPath);
      await fs.writeFile(path.join(externalSkillPath, "SKILL.md"), "# External Skill\n", "utf-8");

      await protocol.ensureAgentConfigurations(tmpDir);

      for (const platformSkillRoot of skillPlatforms) {
        const installedSkillPath = path.join(tmpDir, platformSkillRoot, "external-skill", "SKILL.md");
        expect(await fs.pathExists(installedSkillPath)).toBe(true);
      }

      await fs.remove(externalTemplateRoot);
    });

    it("should install template-managed skills to all configured platform skill directories", async () => {
      const templateSkillPath = path.join(tmpDir, "assets", "skills", "my-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# My Skill\n\nFrom template.\n", "utf-8");

      await protocol.ensureAgentConfigurations(tmpDir);

      for (const platformSkillRoot of skillPlatforms) {
        const installedSkillPath = path.join(tmpDir, platformSkillRoot, "my-skill", "SKILL.md");
        expect(await fs.pathExists(installedSkillPath)).toBe(true);
        expect(await fs.readFile(installedSkillPath, "utf-8")).toContain("From template.");
      }
    });

    it("should distribute fine-grained Codex managed skills to the documented repo skill location", async () => {
      protocol = new AgentFileProtocol();

      await protocol.ensureAgentConfigurations(tmpDir, ["codex"]);

      const expectedSkillNames = [
        "jumbo-bootstrap-session",
        "jumbo-command-discovery",
        "jumbo-context-maintenance",
        "jumbo-correction-capture",
      ];

      for (const skillName of expectedSkillNames) {
        expect(await fs.pathExists(path.join(tmpDir, ".agents", "skills", skillName, "SKILL.md"))).toBe(true);
        expect(await fs.pathExists(path.join(tmpDir, ".codex", "skills", skillName, "SKILL.md"))).toBe(false);
      }
    });

    it("should remove obsolete Jumbo-managed Codex skill copies while preserving user-owned Codex skills", async () => {
      const managedSkillContent =
        "---\nname: managed-skill\ndescription: Managed.\n---\n\n# Managed\n\nCurrent.\n";
      const templateSkillPath = path.join(tmpDir, "assets", "skills", "managed-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), managedSkillContent, "utf-8");

      const obsoleteCodexSkillPath = path.join(tmpDir, ".codex", "skills", "managed-skill");
      await fs.ensureDir(obsoleteCodexSkillPath);
      await fs.writeFile(path.join(obsoleteCodexSkillPath, "SKILL.md"), managedSkillContent, "utf-8");

      const userCodexSkillPath = path.join(tmpDir, ".codex", "skills", "my-custom-skill");
      await fs.ensureDir(userCodexSkillPath);
      await fs.writeFile(
        path.join(userCodexSkillPath, "SKILL.md"),
        "---\nname: my-custom-skill\ndescription: User owned.\n---\n\n# User\n\nKeep me.\n",
        "utf-8"
      );

      await protocol.ensureAgentConfigurations(tmpDir, ["codex"]);

      expect(await fs.pathExists(path.join(tmpDir, ".agents", "skills", "managed-skill", "SKILL.md"))).toBe(true);
      expect(await fs.pathExists(obsoleteCodexSkillPath)).toBe(false);
      expect(await fs.readFile(path.join(userCodexSkillPath, "SKILL.md"), "utf-8")).toContain("Keep me.");
    });

    it("should keep user-created skills and avoid overwriting managed skills during additive install", async () => {
      const templateSkillPath = path.join(tmpDir, "assets", "skills", "managed-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# Managed\n\nTemplate version.\n", "utf-8");

      const userSkillPath = path.join(tmpDir, ".claude", "skills", "my-custom-skill");
      await fs.ensureDir(userSkillPath);
      await fs.writeFile(path.join(userSkillPath, "SKILL.md"), "# User\n\nKeep me.\n", "utf-8");

      const managedSkillPath = path.join(tmpDir, ".claude", "skills", "managed-skill");
      await fs.ensureDir(managedSkillPath);
      await fs.writeFile(path.join(managedSkillPath, "SKILL.md"), "# Managed\n\nLocal customization.\n", "utf-8");

      await protocol.ensureAgentConfigurations(tmpDir);

      const userSkillContent = await fs.readFile(path.join(userSkillPath, "SKILL.md"), "utf-8");
      expect(userSkillContent).toContain("Keep me.");

      const managedSkillContent = await fs.readFile(path.join(managedSkillPath, "SKILL.md"), "utf-8");
      expect(managedSkillContent).toContain("Local customization.");
      expect(managedSkillContent).not.toContain("Template version.");
    });

    it("should create CLAUDE.md with thin reference to JUMBO.md", async () => {
      await protocol.ensureAgentConfigurations(tmpDir);

      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const exists = await fs.pathExists(claudeMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(claudeMdPath, "utf-8");
      expect(content).toContain("JUMBO.md");
      expect(content).toContain("# CLAUDE.md");
    });

    it("should create GEMINI.md with thin reference to JUMBO.md for Antigravity compatibility", async () => {
      await protocol.ensureAgentConfigurations(tmpDir, ["antigravity"]);

      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const exists = await fs.pathExists(geminiMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(geminiMdPath, "utf-8");
      expect(content).toContain("JUMBO.md");
      expect(content).toContain("# GEMINI.md");
    });

    it("should create .claude/settings.json with SessionStart hook", async () => {
      await protocol.ensureAgentConfigurations(tmpDir);

      const settingsPath = path.join(tmpDir, ".claude", "settings.json");
      const exists = await fs.pathExists(settingsPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      expect(settings.hooks?.SessionStart).toBeDefined();
      expect(settings.hooks.SessionStart[0].matcher).toBe("startup");
      expect(settings.hooks.SessionStart[0].hooks[0].command).toBe("jumbo session start");
      expect(settings.hooks?.SessionEnd).toBeUndefined();
    });

    it("should create .claude/settings.json with jumbo --help permission", async () => {
      await protocol.ensureAgentConfigurations(tmpDir);

      const settingsPath = path.join(tmpDir, ".claude", "settings.json");
      const content = await fs.readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      expect(settings.permissions?.allow).toBeDefined();
      expect(settings.permissions.allow).toContain("Bash(jumbo --help)");
    });

    it("should clean up legacy Antigravity hooks", async () => {
      // Pre-create legacy hook runner and hooks
      const hookRunnerPath = path.join(tmpDir, ".agents", "jumbo", "antigravity-hook.mjs");
      await fs.ensureDir(path.dirname(hookRunnerPath));
      await fs.writeFile(hookRunnerPath, "JUMBO_MANAGED_ANTIGRAVITY_HOOK_RUNNER_V1", "utf-8");

      const hooksPath = path.join(tmpDir, ".agents", "hooks.json");
      await fs.writeFile(
        hooksPath,
        JSON.stringify({
          "jumbo-session-bootstrap": {
            PreInvocation: [{ type: "command", command: "node ..." }]
          },
          "user-linter": {
            enabled: false
          }
        }, null, 2),
        "utf-8"
      );

      await protocol.ensureAgentConfigurations(tmpDir, ["antigravity"]);

      expect(await fs.pathExists(hookRunnerPath)).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, ".agents", "jumbo"))).toBe(false);

      const content = await fs.readFile(hooksPath, "utf-8");
      const hooks = JSON.parse(content);
      expect(hooks["jumbo-session-bootstrap"]).toBeUndefined();
      expect(hooks["user-linter"].enabled).toBe(false);
    });

    it("should create .github/copilot-instructions.md with thin reference", async () => {
      await protocol.ensureAgentConfigurations(tmpDir);

      const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
      const exists = await fs.pathExists(copilotPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(copilotPath, "utf-8");
      expect(content).toContain("JUMBO.md");
    });

    it("should append reference if CLAUDE.md exists without it", async () => {
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      await fs.writeFile(
        claudeMdPath,
        "# CLAUDE.md\n\nExisting instructions here.",
        "utf-8"
      );

      await protocol.ensureAgentConfigurations(tmpDir);

      const content = await fs.readFile(claudeMdPath, "utf-8");
      expect(content).toContain("Existing instructions here.");
      expect(content).toContain("JUMBO.md");
    });

    it("should not duplicate reference if already present in CLAUDE.md", async () => {
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const initialContent = AgentFileReferenceContent.getAgentFileReference("CLAUDE.md");
      await fs.writeFile(claudeMdPath, initialContent, "utf-8");

      await protocol.ensureAgentConfigurations(tmpDir);

      const content = await fs.readFile(claudeMdPath, "utf-8");
      const occurrences = (content.match(/See JUMBO\.md and follow all instructions/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should handle all agents independently", async () => {
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      await fs.writeFile(claudeMdPath, "# CLAUDE.md\n\nExisting content.", "utf-8");

      await protocol.ensureAgentConfigurations(tmpDir);

      const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
      expect(claudeContent).toContain("JUMBO.md");

      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const geminiExists = await fs.pathExists(geminiMdPath);
      expect(geminiExists).toBe(true);

      const claudeSettingsPath = path.join(tmpDir, ".claude", "settings.json");
      const claudeSettingsExists = await fs.pathExists(claudeSettingsPath);
      expect(claudeSettingsExists).toBe(true);

      const antigravityHooksPath = path.join(tmpDir, ".agents", "hooks.json");
      const antigravityHooksExists = await fs.pathExists(antigravityHooksPath);
      expect(antigravityHooksExists).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, ".gemini", "settings.json"))).toBe(false);

      const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
      const copilotExists = await fs.pathExists(copilotPath);
      expect(copilotExists).toBe(true);

      const hooksPath = path.join(tmpDir, ".github", "hooks", "hooks.json");
      const hooksExists = await fs.pathExists(hooksPath);
      expect(hooksExists).toBe(true);

      const cursorRulesPath = path.join(tmpDir, ".cursor", "rules", "jumbo.mdc");
      const cursorRulesExists = await fs.pathExists(cursorRulesPath);
      expect(cursorRulesExists).toBe(true);

      const cursorHooksPath = path.join(tmpDir, ".cursor", "hooks.json");
      const cursorHooksExists = await fs.pathExists(cursorHooksPath);
      expect(cursorHooksExists).toBe(true);

      const openCodePluginPath = path.join(tmpDir, ".opencode", "plugins", "jumbo.js");
      expect(await fs.pathExists(openCodePluginPath)).toBe(true);
    });

    it("should create .github/hooks/hooks.json with SessionStart hook", async () => {
      await protocol.ensureAgentConfigurations(tmpDir);

      const hooksPath = path.join(tmpDir, ".github", "hooks", "hooks.json");
      const exists = await fs.pathExists(hooksPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(hooksPath, "utf-8");
      const hooks = JSON.parse(content);

      expect(hooks.version).toBe(1);
      expect(hooks.hooks).toBeDefined();
      expect(hooks.hooks.sessionStart).toBeDefined();
      expect(hooks.hooks.sessionStart.length).toBeGreaterThan(0);

      const sessionStartHook = hooks.hooks.sessionStart[0];
      expect(sessionStartHook.type).toBe("command");
      expect(sessionStartHook.bash).toBe("jumbo session start");
    });
  });

  describe("repair", () => {
    describe("repairJumboMd()", () => {
      it("should create JUMBO.md if missing", async () => {
        await protocol.repairJumboMd(tmpDir);

        const jumboMdPath = path.join(tmpDir, "JUMBO.md");
        const exists = await fs.pathExists(jumboMdPath);
        expect(exists).toBe(true);

        const content = await fs.readFile(jumboMdPath, "utf-8");
        expect(content).toContain(JumboMdContent.getCurrentSectionMarker());
      });

      it("should replace outdated Jumbo section", async () => {
        const jumboMdPath = path.join(tmpDir, "JUMBO.md");
        const currentMarker = JumboMdContent.getCurrentSectionMarker();
        const outdatedContent = `# JUMBO.md\n\n${currentMarker}\n\nOld outdated content.\n`;
        await fs.writeFile(jumboMdPath, outdatedContent, "utf-8");

        await protocol.repairJumboMd(tmpDir);

        const content = await fs.readFile(jumboMdPath, "utf-8");
        expect(content).toContain(JumboMdContent.getJumboSection());
        expect(content).not.toContain("Old outdated content.");
      });

      it("should replace legacy Jumbo section with current version", async () => {
        const jumboMdPath = path.join(tmpDir, "JUMBO.md");
        const legacyMarker = JumboMdContent.getLegacySectionMarkers()[0];
        const legacyContent = `# JUMBO.md\n\n${legacyMarker}\n\nLegacy content.\n`;
        await fs.writeFile(jumboMdPath, legacyContent, "utf-8");

        await protocol.repairJumboMd(tmpDir);

        const content = await fs.readFile(jumboMdPath, "utf-8");
        expect(content).toContain(JumboMdContent.getJumboSection());
        expect(content).not.toContain("Legacy content.");
        expect(content).not.toContain(legacyMarker);
      });
    });

    describe("repairAgentsMd()", () => {
      it("should create AGENTS.md if missing", async () => {
        await protocol.repairAgentsMd(tmpDir);

        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const exists = await fs.pathExists(agentsMdPath);
        expect(exists).toBe(true);

        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain("See JUMBO.md and follow all instructions.");
      });

      it("should replace outdated Jumbo section with thin reference", async () => {
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
        const outdatedContent = `# Agents.md\n\n${currentMarker}\n\nDear Agent,\n\nOld verbose content.\n`;
        await fs.writeFile(agentsMdPath, outdatedContent, "utf-8");

        await protocol.repairAgentsMd(tmpDir);

        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain("See JUMBO.md and follow all instructions.");
        expect(content).not.toContain("Dear Agent,");
        expect(content).not.toContain("Old verbose content.");
      });

      it("should replace legacy Jumbo section with thin reference", async () => {
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const legacyMarker = AgentsMdContent.getLegacyJumboSectionMarkers()[0];
        const legacyContent = `# Agents.md\n\n${legacyMarker}\n\nLegacy content.\n`;
        await fs.writeFile(agentsMdPath, legacyContent, "utf-8");

        await protocol.repairAgentsMd(tmpDir);

        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain("See JUMBO.md and follow all instructions.");
        expect(content).not.toContain("Legacy content.");
        expect(content).not.toContain(legacyMarker);
      });

      it("should preserve non-Jumbo content", async () => {
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
        const content = `# Agents.md\n\n## My Custom Section\n\nKeep this.\n\n${currentMarker}\n\nOld.\n`;
        await fs.writeFile(agentsMdPath, content, "utf-8");

        await protocol.repairAgentsMd(tmpDir);

        const result = await fs.readFile(agentsMdPath, "utf-8");
        expect(result).toContain("My Custom Section");
        expect(result).toContain("Keep this.");
      });

      it("should append thin reference section if not present", async () => {
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        await fs.writeFile(agentsMdPath, "# Agents.md\n\nCustom content only.", "utf-8");

        await protocol.repairAgentsMd(tmpDir);

        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain("Custom content only.");
        expect(content).toContain("See JUMBO.md and follow all instructions.");
      });
    });

    describe("repairAgentConfigurations()", () => {
      it("should overwrite template-managed skills and preserve user-created skills", async () => {
        const templateSkillPath = path.join(tmpDir, "assets", "skills", "managed-skill");
        await fs.ensureDir(templateSkillPath);
        await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# Managed\n\nTemplate current version.\n", "utf-8");

        const managedSkillPath = path.join(tmpDir, ".agents", "skills", "managed-skill");
        await fs.ensureDir(managedSkillPath);
        await fs.writeFile(path.join(managedSkillPath, "SKILL.md"), "# Managed\n\nOutdated version.\n", "utf-8");

        const userSkillPath = path.join(tmpDir, ".agents", "skills", "my-custom-skill");
        await fs.ensureDir(userSkillPath);
        await fs.writeFile(path.join(userSkillPath, "SKILL.md"), "# User\n\nKeep me.\n", "utf-8");

        await protocol.repairAgentConfigurations(tmpDir);

        const repairedManagedContent = await fs.readFile(path.join(managedSkillPath, "SKILL.md"), "utf-8");
        expect(repairedManagedContent).toContain("Template current version.");
        expect(repairedManagedContent).not.toContain("Outdated version.");

        const preservedUserContent = await fs.readFile(path.join(userSkillPath, "SKILL.md"), "utf-8");
        expect(preservedUserContent).toContain("Keep me.");
      });

      it("should remove obsolete Codex skill copies during repeated repair while preserving user-owned Codex skills", async () => {
        const managedSkillContent =
          "---\nname: managed-skill\ndescription: Managed.\n---\n\n# Managed\n\nTemplate current version.\n";
        const templateSkillPath = path.join(tmpDir, "assets", "skills", "managed-skill");
        await fs.ensureDir(templateSkillPath);
        await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), managedSkillContent, "utf-8");

        const userSameNameTemplatePath = path.join(tmpDir, "assets", "skills", "user-owned-same-name");
        await fs.ensureDir(userSameNameTemplatePath);
        await fs.writeFile(
          path.join(userSameNameTemplatePath, "SKILL.md"),
          "---\nname: user-owned-same-name\ndescription: Managed.\n---\n\n# Managed\n\nTemplate current version.\n",
          "utf-8"
        );

        const obsoleteCodexSkillPath = path.join(tmpDir, ".codex", "skills", "managed-skill");
        await fs.ensureDir(obsoleteCodexSkillPath);
        await fs.writeFile(path.join(obsoleteCodexSkillPath, "SKILL.md"), managedSkillContent, "utf-8");

        const userSameNameCodexSkillPath = path.join(tmpDir, ".codex", "skills", "user-owned-same-name");
        await fs.ensureDir(userSameNameCodexSkillPath);
        await fs.writeFile(
          path.join(userSameNameCodexSkillPath, "SKILL.md"),
          "---\nname: user-owned-same-name\ndescription: User owned.\n---\n\n# User\n\nKeep same-name user skill.\n",
          "utf-8"
        );

        await protocol.repairAgentConfigurations(tmpDir, ["codex"]);
        await protocol.repairAgentConfigurations(tmpDir, ["codex"]);

        const repairedManagedContent = await fs.readFile(
          path.join(tmpDir, ".agents", "skills", "managed-skill", "SKILL.md"),
          "utf-8"
        );
        expect(repairedManagedContent).toContain("Template current version.");
        expect(await fs.pathExists(obsoleteCodexSkillPath)).toBe(false);
        expect(await fs.readFile(path.join(userSameNameCodexSkillPath, "SKILL.md"), "utf-8")).toContain(
          "Keep same-name user skill."
        );
      });

      it("should call repair on each configurer", async () => {
        await protocol.repairAgentConfigurations(tmpDir);

        const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
        expect(await fs.pathExists(claudeMdPath)).toBe(true);

        const geminiMdPath = path.join(tmpDir, "GEMINI.md");
        expect(await fs.pathExists(geminiMdPath)).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, ".agents", "hooks.json"))).toBe(false);
      expect(await fs.pathExists(path.join(tmpDir, ".agents", "jumbo", "antigravity-hook.mjs"))).toBe(false);

        const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
        expect(await fs.pathExists(copilotPath)).toBe(true);
      });

      it("should replace legacy CLAUDE.md reference block with thin reference", async () => {
        const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
        const oldContent =
          "# CLAUDE.md\n\nCRITICAL STARTUP INSTRUCTION: Old instructions.\n\nOld middle.\n\n!!!IMPORTANT!!! Old.\n";
        await fs.writeFile(claudeMdPath, oldContent, "utf-8");

        await protocol.repairAgentConfigurations(tmpDir);

        const content = await fs.readFile(claudeMdPath, "utf-8");
        expect(content).toContain("# CLAUDE.md");
        expect(content).toContain("See JUMBO.md and follow all instructions.");
        expect(content).not.toContain("CRITICAL STARTUP INSTRUCTION");
        expect(content).not.toContain("Old instructions.");
      });

      it("should replace legacy copilot-instructions.md section with thin reference", async () => {
        const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
        await fs.ensureDir(path.join(tmpDir, ".github"));
        const oldContent =
          "# Copilot\n\n## Jumbo Context Management\n\nOld copilot content.\n";
        await fs.writeFile(copilotPath, oldContent, "utf-8");

        await protocol.repairAgentConfigurations(tmpDir);

        const content = await fs.readFile(copilotPath, "utf-8");
        expect(content).toContain("See ../JUMBO.md and follow all instructions.");
        expect(content).not.toContain("Old copilot content.");
        expect(content).not.toContain("## Jumbo Context Management");
      });
    });

    describe("repair idempotency", () => {
      it("should be safe to run repair multiple times", async () => {
        await protocol.repairJumboMd(tmpDir);
        await protocol.repairAgentsMd(tmpDir);
        await protocol.repairAgentConfigurations(tmpDir);
        await protocol.repairJumboMd(tmpDir);
        await protocol.repairAgentsMd(tmpDir);
        await protocol.repairAgentConfigurations(tmpDir);

        const jumboMdPath = path.join(tmpDir, "JUMBO.md");
        const jumboContent = await fs.readFile(jumboMdPath, "utf-8");
        const jumboMarkerRegex = new RegExp(
          JumboMdContent.getCurrentSectionMarker().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        const jumboOccurrences = (jumboContent.match(jumboMarkerRegex) || []).length;
        expect(jumboOccurrences).toBe(1);

        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const agentsContent = await fs.readFile(agentsMdPath, "utf-8");
        const agentsMarkerRegex = new RegExp(
          AgentsMdContent.getCurrentJumboSectionMarker().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        const agentsOccurrences = (agentsContent.match(agentsMarkerRegex) || []).length;
        expect(agentsOccurrences).toBe(1);

        const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
        const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
        const claudeOccurrences = (claudeContent.match(/See JUMBO\.md and follow all instructions/g) || []).length;
        expect(claudeOccurrences).toBe(1);
      });
    });
  });

  describe("idempotency", () => {
    it("should be safe to run ensureJumboMd multiple times", async () => {
      await protocol.ensureJumboMd(tmpDir);
      await protocol.ensureJumboMd(tmpDir);
      await protocol.ensureJumboMd(tmpDir);

      const jumboMdPath = path.join(tmpDir, "JUMBO.md");
      const content = await fs.readFile(jumboMdPath, "utf-8");
      const markerRegex = new RegExp(
        JumboMdContent.getCurrentSectionMarker().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      const occurrences = (content.match(markerRegex) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should be safe to run ensureAgentsMd multiple times", async () => {
      await protocol.ensureAgentsMd(tmpDir);
      await protocol.ensureAgentsMd(tmpDir);
      await protocol.ensureAgentsMd(tmpDir);

      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const content = await fs.readFile(agentsMdPath, "utf-8");
      const markerRegex = new RegExp(
        AgentsMdContent.getCurrentJumboSectionMarker().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      const occurrences = (content.match(markerRegex) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should be safe to run ensureAgentConfigurations multiple times", async () => {
      await protocol.ensureAgentConfigurations(tmpDir);
      await protocol.ensureAgentConfigurations(tmpDir);
      await protocol.ensureAgentConfigurations(tmpDir);

      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
      const claudeOccurrences = (claudeContent.match(/See JUMBO\.md and follow all instructions/g) || []).length;
      expect(claudeOccurrences).toBe(1);

      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const geminiContent = await fs.readFile(geminiMdPath, "utf-8");
      const geminiOccurrences = (geminiContent.match(/See JUMBO\.md and follow all instructions/g) || []).length;
      expect(geminiOccurrences).toBe(1);

      expect(await fs.pathExists(path.join(tmpDir, ".agents", "hooks.json"))).toBe(false);

      const claudeSettingsPath = path.join(tmpDir, ".claude", "settings.json");
      const claudeSettings = JSON.parse(await fs.readFile(claudeSettingsPath, "utf-8"));
      expect(claudeSettings.hooks.SessionStart.length).toBe(2);
      expect(claudeSettings.hooks.SessionStart[0].hooks.length).toBe(1);
      expect(claudeSettings.hooks.SessionStart[1].hooks.length).toBe(1);
    });
  });

  describe("getPlannedFileChanges()", () => {
    it("should include JUMBO.md in planned changes", async () => {
      const changes = await protocol.getPlannedFileChanges(tmpDir);

      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "JUMBO.md",
            action: "create",
          }),
        ])
      );
    });

    it("should include AGENTS.md in planned changes", async () => {
      const changes = await protocol.getPlannedFileChanges(tmpDir);

      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "AGENTS.md",
            action: "create",
          }),
        ])
      );
    });

    it("should include planned skill sync changes when assets are present", async () => {
      const templateSkillPath = path.join(tmpDir, "assets", "skills", "my-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# My Skill\n", "utf-8");

      const changes = await protocol.getPlannedFileChanges(tmpDir);

      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ".agents/skills/my-skill",
            description: expect.stringContaining("assets/skills"),
          }),
          expect.objectContaining({
            path: ".claude/skills/my-skill",
            description: expect.stringContaining("assets/skills"),
          }),
          expect.objectContaining({
            path: ".vibe/skills/my-skill",
            description: expect.stringContaining("assets/skills"),
          }),
        ])
      );
    });

    it("should filter agent-specific planned changes to the selected agents", async () => {
      const templateSkillPath = path.join(tmpDir, "assets", "skills", "my-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# My Skill\n", "utf-8");

      const changes = await protocol.getPlannedFileChanges(tmpDir, ["antigravity", "copilot"]);

      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "JUMBO.md" }),
          expect.objectContaining({ path: "AGENTS.md" }),
          expect.objectContaining({ path: "GEMINI.md" }),
          expect.objectContaining({ path: ".github/copilot-instructions.md" }),
          expect.objectContaining({ path: ".github/hooks/hooks.json" }),
          expect.objectContaining({ path: ".agents/skills/my-skill" }),
        ])
      );

      expect(changes).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "CLAUDE.md" }),
          expect.objectContaining({ path: ".claude/settings.json" }),
          expect.objectContaining({ path: ".claude/skills/my-skill" }),
          expect.objectContaining({ path: ".vibe/skills/my-skill" }),
        ])
      );
    });

    it("should include the OpenCode plugin only when OpenCode is selected", async () => {
      const changes = await protocol.getPlannedFileChanges(tmpDir, ["opencode"]);

      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "JUMBO.md" }),
          expect.objectContaining({ path: "AGENTS.md" }),
          expect.objectContaining({ path: ".opencode/plugins/jumbo.js" }),
        ])
      );
      expect(changes).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ".codex/hooks.json" }),
          expect.objectContaining({ path: ".cursor/hooks.json" }),
        ])
      );
    });
  });
});
