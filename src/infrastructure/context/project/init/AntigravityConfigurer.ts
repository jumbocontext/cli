/**
 * Infrastructure: Antigravity CLI Configurer
 *
 * Encapsulates Antigravity workspace configuration:
 * - GEMINI.md compatibility reference to JUMBO.md
 * - workspace skills distributed through .agents/skills
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { AgentFileReferenceContent } from "../../../../domain/project/AgentFileReferenceContent.js";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

export class AntigravityConfigurer implements IConfigurer {
  readonly agent = {
    id: "antigravity",
    name: "Antigravity",
  } as const;

  readonly skillPlatforms = [".agents/skills"] as const;

  /**
   * Configure all Antigravity CLI requirements for Jumbo.
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureGeminiMdCompatibility(projectRoot);
    await this.removeLegacyGeminiConfigs(projectRoot);
    await this.removeLegacyAntigravityHooks(projectRoot);
  }

  /**
   * Ensure GEMINI.md exists because Antigravity documents compatibility with it.
   */
  private async ensureGeminiMdCompatibility(
    projectRoot: string,
  ): Promise<void> {
    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    const reference =
      AgentFileReferenceContent.getAgentFileReference("GEMINI.md");

    try {
      const exists = await fs.pathExists(geminiMdPath);

      if (!exists) {
        await fs.writeFile(geminiMdPath, reference, "utf-8");
        return;
      }

      const content = await fs.readFile(geminiMdPath, "utf-8");

      if (!content.includes("JUMBO.md")) {
        const updatedContent = content.trimEnd() + "\n\n" + reference;
        await fs.writeFile(geminiMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to update Antigravity GEMINI.md compatibility file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Repair Antigravity configuration by replacing stale managed content.
   */
  async repair(projectRoot: string): Promise<void> {
    await this.repairGeminiMdCompatibility(projectRoot);
    await this.removeLegacyGeminiConfigs(projectRoot);
    await this.removeLegacyAntigravityHooks(projectRoot);
  }

  /**
   * Repair GEMINI.md by replacing legacy Jumbo reference content.
   */
  private async repairGeminiMdCompatibility(
    projectRoot: string,
  ): Promise<void> {
    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    const reference =
      AgentFileReferenceContent.getAgentFileReference("GEMINI.md");

    try {
      const exists = await fs.pathExists(geminiMdPath);

      if (!exists) {
        await fs.writeFile(geminiMdPath, reference, "utf-8");
        return;
      }

      const content = await fs.readFile(geminiMdPath, "utf-8");
      const replaced = AgentFileReferenceContent.replaceAgentFileReference(
        content,
        "GEMINI.md",
      );

      if (replaced !== null) {
        await fs.writeFile(geminiMdPath, replaced, "utf-8");
      } else if (!content.includes("JUMBO.md")) {
        const updatedContent = content.trimEnd() + "\n\n" + reference;
        await fs.writeFile(geminiMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to repair Antigravity GEMINI.md compatibility file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(
    projectRoot: string,
  ): Promise<PlannedFileChange[]> {
    const changes: PlannedFileChange[] = [];

    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    changes.push({
      path: "GEMINI.md",
      action: (await fs.pathExists(geminiMdPath)) ? "modify" : "create",
      description: "Add Antigravity-compatible Jumbo instructions",
    });

    const hooksPath = path.join(projectRoot, ".agents", "hooks.json");
    if (await fs.pathExists(hooksPath)) {
      changes.push({
        path: ".agents/hooks.json",
        action: "modify",
        description: "Remove legacy Antigravity hook configuration",
      });
    }

    const hookRunnerPath = this.getHookRunnerPath(projectRoot);
    if (await fs.pathExists(hookRunnerPath)) {
      changes.push({
        path: ".agents/jumbo/antigravity-hook.mjs",
        action: "modify",
        description: "Remove legacy Antigravity hook runner",
      });
    }

    const geminiSettingsPath = path.join(
      projectRoot,
      ".gemini",
      "settings.json",
    );
    if (await fs.pathExists(geminiSettingsPath)) {
      changes.push({
        path: ".gemini/settings.json",
        action: "modify",
        description: "Remove legacy Gemini settings and Jumbo hook configs",
      });
    }

    const geminiSkillsPath = path.join(projectRoot, ".gemini", "skills");
    if (await fs.pathExists(geminiSkillsPath)) {
      changes.push({
        path: ".gemini/skills",
        action: "modify",
        description: "Remove legacy Gemini skills",
      });
    }

    return changes;
  }

  private async removeLegacyAntigravityHooks(
    projectRoot: string,
  ): Promise<void> {
    const agentsDir = path.join(projectRoot, ".agents");
    if (!(await fs.pathExists(agentsDir))) {
      return;
    }

    // 1. Delete hook runner
    const runnerPath = this.getHookRunnerPath(projectRoot);
    if (await fs.pathExists(runnerPath)) {
      await fs.remove(runnerPath);
    }
    const jumboDir = path.dirname(runnerPath);
    if (await fs.pathExists(jumboDir)) {
      try {
        const files = await fs.readdir(jumboDir);
        if (files.length === 0) {
          await fs.remove(jumboDir);
        }
      } catch {
        // Ignore
      }
    }

    // 2. Clean jumbo-session-bootstrap hook from .agents/hooks.json
    const hooksPath = path.join(projectRoot, ".agents", "hooks.json");
    if (await fs.pathExists(hooksPath)) {
      try {
        const content = await fs.readFile(hooksPath, "utf-8");
        if (content.trim()) {
          const hooks = JSON.parse(content);
          if (hooks["jumbo-session-bootstrap"]) {
            delete hooks["jumbo-session-bootstrap"];

            if (Object.keys(hooks).length === 0) {
              await fs.remove(hooksPath);
            } else {
              await fs.writeFile(
                hooksPath,
                JSON.stringify(hooks, null, 2) + "\n",
                "utf-8",
              );
            }
          }
        }
      } catch (error) {
        console.warn(
          `Warning: Failed to clean legacy hooks in .agents/hooks.json: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private async removeLegacyGeminiConfigs(projectRoot: string): Promise<void> {
    const geminiDir = path.join(projectRoot, ".gemini");
    if (!(await fs.pathExists(geminiDir))) {
      return;
    }

    // 1. Clean up .gemini/settings.json
    const settingsPath = path.join(geminiDir, "settings.json");
    if (await fs.pathExists(settingsPath)) {
      try {
        const content = await fs.readFile(settingsPath, "utf-8");
        if (content.trim()) {
          const parsedSettings = JSON.parse(content) as unknown;
          if (!AntigravityConfigurer.isObject(parsedSettings)) {
            return;
          }
          const settings = parsedSettings;

          // Remove jumbo-specific hooks
          if (AntigravityConfigurer.isObject(settings.hooks)) {
            for (const eventType of Object.keys(settings.hooks)) {
              const matchers = settings.hooks[eventType];
              if (Array.isArray(matchers)) {
                const cleanedMatchers = matchers
                  .map((matcher: unknown) => {
                    if (
                      AntigravityConfigurer.isObject(matcher) &&
                      Array.isArray(matcher.hooks)
                    ) {
                      matcher.hooks = matcher.hooks.filter((hook: unknown) => {
                        return AntigravityConfigurer.shouldKeepLegacyHook(hook);
                      });
                    }
                    return matcher;
                  })
                  .filter((matcher: unknown) => {
                    return (
                      AntigravityConfigurer.isObject(matcher) &&
                      Array.isArray(matcher.hooks) &&
                      matcher.hooks.length > 0
                    );
                  });
                settings.hooks[eventType] = cleanedMatchers;

                if (cleanedMatchers.length === 0) {
                  delete settings.hooks[eventType];
                }
              }
            }
            if (Object.keys(settings.hooks).length === 0) {
              delete settings.hooks;
            }
          }

          // Remove jumbo-specific allowed tools
          if (
            AntigravityConfigurer.isObject(settings.tools) &&
            Array.isArray(settings.tools.allowed)
          ) {
            const allowedTools = settings.tools.allowed.filter(
              (tool: unknown) => {
                return (
                  typeof tool === "string" &&
                  !tool.includes("jumbo") &&
                  !tool.includes("antigravity-hook.mjs")
                );
              },
            );
            settings.tools.allowed = allowedTools;
            if (allowedTools.length === 0) {
              delete settings.tools.allowed;
            }
          }
          if (settings.tools && Object.keys(settings.tools).length === 0) {
            delete settings.tools;
          }

          // If settings is now empty, delete settings.json (and backups)
          if (Object.keys(settings).length === 0) {
            await fs.remove(settingsPath);

            const files = await fs.readdir(geminiDir);
            for (const file of files) {
              if (file.startsWith("settings.json.backup.")) {
                await fs.remove(path.join(geminiDir, file));
              }
            }
          } else {
            await fs.writeFile(
              settingsPath,
              JSON.stringify(settings, null, 2) + "\n",
              "utf-8",
            );
          }
        }
      } catch (error) {
        console.warn(
          `Warning: Failed to clean legacy settings in .gemini/settings.json: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // 2. Clean up obsolete Jumbo-managed skills in .gemini/skills
    const skillsDir = path.join(geminiDir, "skills");
    if (await fs.pathExists(skillsDir)) {
      try {
        const skillEntries = await fs.readdir(skillsDir);
        for (const skillName of skillEntries) {
          const skillPath = path.join(skillsDir, skillName);
          const stat = await fs.stat(skillPath);
          if (stat.isDirectory()) {
            await fs.remove(skillPath);
          }
        }

        const remainingSkills = await fs.readdir(skillsDir);
        if (remainingSkills.length === 0) {
          await fs.remove(skillsDir);
        }
      } catch (error) {
        console.warn(
          `Warning: Failed to clean legacy skills in .gemini/skills: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    // 3. Remove .gemini directory if it is now empty
    try {
      const remainingFiles = await fs.readdir(geminiDir);
      if (remainingFiles.length === 0) {
        await fs.remove(geminiDir);
      }
    } catch (error) {
      // Ignore
    }
  }

  private getHookRunnerPath(projectRoot: string): string {
    return path.join(projectRoot, ".agents", "jumbo", "antigravity-hook.mjs");
  }

  private static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private static shouldKeepLegacyHook(hook: unknown): boolean {
    if (!hook) {
      return false;
    }

    if (
      AntigravityConfigurer.isObject(hook) &&
      typeof hook.command === "string"
    ) {
      return !hook.command.includes("jumbo");
    }

    return true;
  }
}
