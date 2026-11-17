/**
 * Infrastructure: GitHub Copilot Configurer
 *
 * Encapsulates all knowledge about GitHub Copilot configuration:
 * - .github/copilot-instructions.md with thin reference to JUMBO.md
 * - .github/hooks/hooks.json with SessionStart hooks
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { CopilotInstructionsContent } from "../../../../domain/project/CopilotInstructionsContent.js";
import { AgentFileAssetContent } from "../../../../domain/project/AgentFileAssetContent.js";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

/**
 * Minimal shapes for the GitHub hooks document. Jumbo's own fragment matches
 * these exactly; external (user-authored) hook files are merged structurally
 * after being narrowed to these shapes at the parse boundary.
 */
interface CopilotHook {
  type?: string;
  bash?: string;
  cwd?: string;
  timeoutSec?: number;
}

interface CopilotHooksDocument {
  version?: number;
  hooks?: Record<string, CopilotHook[]>;
}

export class CopilotConfigurer implements IConfigurer {
  readonly agent = {
    id: "copilot",
    name: "Copilot",
  } as const;

  readonly skillPlatforms = [".agents/skills"] as const;

  /**
   * Configure all GitHub Copilot requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureCopilotInstructions(projectRoot);
    await this.ensureGitHubHooks(projectRoot);
  }

  /**
   * Ensure GitHub Copilot instructions exist in .github/copilot-instructions.md
   */
  private async ensureCopilotInstructions(projectRoot: string): Promise<void> {
    const copilotInstructionsPath = path.join(
      projectRoot,
      ".github",
      "copilot-instructions.md",
    );

    try {
      // Ensure .github directory exists
      await fs.ensureDir(path.join(projectRoot, ".github"));

      const exists = await fs.pathExists(copilotInstructionsPath);

      if (!exists) {
        // File doesn't exist - create with thin reference
        await fs.writeFile(
          copilotInstructionsPath,
          CopilotInstructionsContent.getCopilotInstructions(),
          "utf-8",
        );
        return;
      }

      // File exists - check if Jumbo section is present
      const content = await fs.readFile(copilotInstructionsPath, "utf-8");
      const jumboMarker = CopilotInstructionsContent.getCopilotSectionMarker();

      if (
        !content.includes(jumboMarker) &&
        !content.includes("## Jumbo Context Management")
      ) {
        const updatedContent =
          content + "\n\n" + CopilotInstructionsContent.getCopilotSection();
        await fs.writeFile(copilotInstructionsPath, updatedContent, "utf-8");
      }
      // else: Jumbo section already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to update .github/copilot-instructions.md: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Ensure GitHub hooks are configured in .github/hooks/hooks.json
   */
  private async ensureGitHubHooks(projectRoot: string): Promise<void> {
    try {
      const hooksPath = path.join(
        projectRoot,
        ".github",
        "hooks",
        "hooks.json",
      );

      // Ensure .github/hooks directory exists
      await fs.ensureDir(path.join(projectRoot, ".github", "hooks"));

      const jumboHooks = AgentFileAssetContent.readJson<CopilotHooksDocument>(
        "copilot-hooks.fragment.json",
      );

      // Check if file exists
      const exists = await fs.pathExists(hooksPath);

      if (!exists) {
        // File doesn't exist - create with full content
        await fs.writeFile(
          hooksPath,
          JSON.stringify(jumboHooks, null, 2) + "\n",
          "utf-8",
        );
        return;
      }

      // File exists - merge with existing content
      const existingContent = await fs.readFile(hooksPath, "utf-8");
      let existingHooks = {};

      if (existingContent.trim()) {
        try {
          existingHooks = JSON.parse(existingContent);
        } catch (parseError) {
          // If JSON is malformed, overwrite with our content
          await fs.writeFile(
            hooksPath,
            JSON.stringify(jumboHooks, null, 2) + "\n",
            "utf-8",
          );
          return;
        }
      }

      // Merge hooks - ensure sessionStart hooks are present
      const mergedHooks = this.mergeHooks(existingHooks, jumboHooks);

      await fs.writeFile(
        hooksPath,
        JSON.stringify(mergedHooks, null, 2) + "\n",
        "utf-8",
      );
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to configure GitHub hooks: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Merge hooks, preserving existing content and adding missing Jumbo hooks
   */
  private mergeHooks(
    existing: CopilotHooksDocument,
    jumbo: CopilotHooksDocument,
  ): CopilotHooksDocument {
    const result: CopilotHooksDocument = { ...existing };

    // Ensure version is set
    if (jumbo.version !== undefined) {
      result.version = jumbo.version;
    }

    // Merge hooks
    if (jumbo.hooks) {
      const mergedHooks: Record<string, CopilotHook[]> = {
        ...(result.hooks ?? {}),
      };

      for (const [hookType, hooks] of Object.entries(jumbo.hooks)) {
        if (hooks && Array.isArray(hooks)) {
          const existingHooks = mergedHooks[hookType] ?? [];
          mergedHooks[hookType] = this.mergeHookArray(existingHooks, hooks);
        }
      }

      result.hooks = mergedHooks;
    }

    return result;
  }

  /**
   * Merge hook arrays, deduplicating by command content
   */
  private mergeHookArray(
    existing: CopilotHook[],
    additions: CopilotHook[],
  ): CopilotHook[] {
    const merged = [...existing];
    const existingCommands = new Set(existing.map((h) => JSON.stringify(h)));

    for (const addition of additions) {
      const additionKey = JSON.stringify(addition);
      if (!existingCommands.has(additionKey)) {
        merged.push(addition);
        existingCommands.add(additionKey);
      }
    }

    return merged;
  }

  /**
   * Repair Copilot configuration by replacing stale Jumbo section and ensuring hooks
   */
  async repair(projectRoot: string): Promise<void> {
    await this.repairCopilotInstructions(projectRoot);
    await this.ensureGitHubHooks(projectRoot);
  }

  /**
   * Repair copilot-instructions.md by replacing the Jumbo section with current thin reference
   */
  private async repairCopilotInstructions(projectRoot: string): Promise<void> {
    const copilotInstructionsPath = path.join(
      projectRoot,
      ".github",
      "copilot-instructions.md",
    );

    try {
      await fs.ensureDir(path.join(projectRoot, ".github"));

      const exists = await fs.pathExists(copilotInstructionsPath);

      if (!exists) {
        await fs.writeFile(
          copilotInstructionsPath,
          CopilotInstructionsContent.getCopilotInstructions(),
          "utf-8",
        );
        return;
      }

      const content = await fs.readFile(copilotInstructionsPath, "utf-8");
      const replaced =
        CopilotInstructionsContent.replaceCopilotSection(content);

      if (replaced !== null) {
        // Jumbo section found (current or legacy) - replace with thin reference
        await fs.writeFile(copilotInstructionsPath, replaced, "utf-8");
      } else {
        const updatedContent =
          content + "\n\n" + CopilotInstructionsContent.getCopilotSection();
        await fs.writeFile(copilotInstructionsPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to repair .github/copilot-instructions.md: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(
    projectRoot: string,
  ): Promise<PlannedFileChange[]> {
    const copilotInstructionsPath = path.join(
      projectRoot,
      ".github",
      "copilot-instructions.md",
    );
    const hooksPath = path.join(projectRoot, ".github", "hooks", "hooks.json");

    return [
      {
        path: ".github/copilot-instructions.md",
        action: (await fs.pathExists(copilotInstructionsPath))
          ? "modify"
          : "create",
        description: "Add Jumbo instructions",
      },
      {
        path: ".github/hooks/hooks.json",
        action: (await fs.pathExists(hooksPath)) ? "modify" : "create",
        description: "Add GitHub hooks configuration",
      },
    ];
  }
}
