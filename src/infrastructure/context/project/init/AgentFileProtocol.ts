/**
 * Infrastructure: Agent File Protocol Implementation
 *
 * Orchestrates AI agent configuration during project initialization.
 * Delegates agent-specific logic to dedicated Configurer classes.
 *
 * Extension:
 * To add a new agent, create a *Configurer class that implements
 * IConfigurer interface, then add it to the configurers array below.
 * No changes to IAgentFileProtocol needed.
 *
 * Operations are idempotent and gracefully handle errors to avoid
 * failing project initialization if file writes fail.
 */

import path from "path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import { AgentId, AvailableAgent } from "../../../../application/context/project/init/AgentSelection.js";
import { IAgentFileProtocol } from "../../../../application/context/project/init/IAgentFileProtocol.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";
import { JumboMdContent } from "../../../../domain/project/JumboMdContent.js";
import { AgentsMdContent } from "../../../../domain/project/AgentsMdContent.js";
import { IConfigurer } from "./IConfigurer.js";
import { ClaudeConfigurer } from "./ClaudeConfigurer.js";
import { AntigravityConfigurer } from "./AntigravityConfigurer.js";
import { CopilotConfigurer } from "./CopilotConfigurer.js";
import { VibeConfigurer } from "./VibeConfigurer.js";
import { CodexConfigurer } from "./CodexConfigurer.js";
import { CursorConfigurer } from "./CursorConfigurer.js";
import { OpenCodeConfigurer } from "./OpenCodeConfigurer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TEMPLATE_SKILLS_ROOT = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "assets",
  "skills"
);
export class AgentFileProtocol implements IAgentFileProtocol {
  private readonly configurers: IConfigurer[];

  constructor(private readonly templateSkillsRoot: string = DEFAULT_TEMPLATE_SKILLS_ROOT) {
    this.configurers = [
      new ClaudeConfigurer(),
      new AntigravityConfigurer(),
      new CopilotConfigurer(),
      new VibeConfigurer(),
      new CodexConfigurer(templateSkillsRoot),
      new CursorConfigurer(),
      new OpenCodeConfigurer(),
    ];
  }

  /**
   * Ensure JUMBO.md exists with full Jumbo instructions
   */
  async ensureJumboMd(projectRoot: string): Promise<void> {
    const jumboMdPath = path.join(projectRoot, "JUMBO.md");

    try {
      const exists = await fs.pathExists(jumboMdPath);

      if (!exists) {
        await fs.writeFile(jumboMdPath, JumboMdContent.getFullContent(), "utf-8");
        return;
      }

      const content = await fs.readFile(jumboMdPath, "utf-8");
      const replaced = JumboMdContent.replaceJumboSection(content);

      if (replaced !== null) {
        await fs.writeFile(jumboMdPath, replaced, "utf-8");
      } else {
        const updatedContent = content + "\n\n" + JumboMdContent.getJumboSection();
        await fs.writeFile(jumboMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(`Warning: Failed to update JUMBO.md: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure AGENTS.md exists with thin reference to JUMBO.md
   */
  async ensureAgentsMd(projectRoot: string): Promise<void> {
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");

    try {
      const exists = await fs.pathExists(agentsMdPath);

      if (!exists) {
        await fs.writeFile(agentsMdPath, AgentsMdContent.getFullContent(), "utf-8");
        return;
      }

      const content = await fs.readFile(agentsMdPath, "utf-8");
      const replaced = AgentsMdContent.replaceJumboSection(content);

      if (replaced !== null) {
        await fs.writeFile(agentsMdPath, replaced, "utf-8");
      } else {
        const updatedContent = content + "\n\n" + AgentsMdContent.getJumboSection();
        await fs.writeFile(agentsMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(`Warning: Failed to update AGENTS.md: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure all supported agents are configured for Jumbo
   */
  async ensureAgentConfigurations(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[]
  ): Promise<void> {
    for (const configurer of this.getConfigurers(selectedAgentIds)) {
      await configurer.configure(projectRoot);
    }

    await this.installSkillsFromTemplates(projectRoot, selectedAgentIds);
  }

  /**
   * Repair JUMBO.md by replacing the Jumbo section with the current version
   */
  async repairJumboMd(projectRoot: string): Promise<void> {
    const jumboMdPath = path.join(projectRoot, "JUMBO.md");

    try {
      const exists = await fs.pathExists(jumboMdPath);

      if (!exists) {
        await fs.writeFile(jumboMdPath, JumboMdContent.getFullContent(), "utf-8");
        return;
      }

      const content = await fs.readFile(jumboMdPath, "utf-8");
      const replaced = JumboMdContent.replaceJumboSection(content);

      if (replaced !== null) {
        await fs.writeFile(jumboMdPath, replaced, "utf-8");
      } else {
        const updatedContent = content + "\n\n" + JumboMdContent.getJumboSection();
        await fs.writeFile(jumboMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(`Warning: Failed to repair JUMBO.md: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Repair AGENTS.md by replacing the Jumbo section with the current thin reference
   */
  async repairAgentsMd(projectRoot: string): Promise<void> {
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");

    try {
      const exists = await fs.pathExists(agentsMdPath);

      if (!exists) {
        await fs.writeFile(agentsMdPath, AgentsMdContent.getFullContent(), "utf-8");
        return;
      }

      const content = await fs.readFile(agentsMdPath, "utf-8");
      const replaced = AgentsMdContent.replaceJumboSection(content);

      if (replaced !== null) {
        await fs.writeFile(agentsMdPath, replaced, "utf-8");
      } else {
        const updatedContent = content + "\n\n" + AgentsMdContent.getJumboSection();
        await fs.writeFile(agentsMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(`Warning: Failed to repair AGENTS.md: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Repair all supported agent configurations
   */
  async repairAgentConfigurations(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[]
  ): Promise<void> {
    for (const configurer of this.getConfigurers(selectedAgentIds)) {
      if (configurer.repair) {
        await configurer.repair(projectRoot);
      } else {
        await configurer.configure(projectRoot);
      }
    }

    await this.repairSkillsFromTemplates(projectRoot, selectedAgentIds);
  }

  getAvailableAgents(): readonly AvailableAgent[] {
    return this.configurers.map((configurer) => configurer.agent);
  }

  /**
   * Get all planned file changes without executing.
   */
  async getPlannedFileChanges(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[]
  ): Promise<PlannedFileChange[]> {
    const changes: PlannedFileChange[] = [];

    // JUMBO.md change
    const jumboMdPath = path.join(projectRoot, "JUMBO.md");
    changes.push({
      path: "JUMBO.md",
      action: (await fs.pathExists(jumboMdPath)) ? "modify" : "create",
      description: "Add Jumbo instructions",
    });

    // AGENTS.md change
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");
    changes.push({
      path: "AGENTS.md",
      action: (await fs.pathExists(agentsMdPath)) ? "modify" : "create",
      description: "Add Jumbo instructions",
    });

    // Collect from all configurers
    for (const configurer of this.getConfigurers(selectedAgentIds)) {
      const configurerChanges = await configurer.getPlannedFileChanges(projectRoot);
      changes.push(...configurerChanges);
    }

    const skillChanges = await this.getSkillPlannedFileChanges(projectRoot, selectedAgentIds);
    changes.push(...skillChanges);

    return changes;
  }

  private async installSkillsFromTemplates(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[]
  ): Promise<void> {
    const templateSkillNames = await this.getTemplateSkillNames();
    if (templateSkillNames.length === 0) {
      return;
    }

    for (const platformSkillsRelativePath of this.getSkillPlatforms(selectedAgentIds)) {
      const platformSkillsRoot = path.join(projectRoot, platformSkillsRelativePath);
      await fs.ensureDir(platformSkillsRoot);

      for (const skillName of templateSkillNames) {
        const sourceSkillDirectory = path.join(this.templateSkillsRoot, skillName);
        const destinationSkillDirectory = path.join(platformSkillsRoot, skillName);

        try {
          await fs.copy(sourceSkillDirectory, destinationSkillDirectory, {
            overwrite: false,
            errorOnExist: false,
          });
        } catch (error) {
          console.warn(
            `Warning: Failed to install template skill '${skillName}' for ${platformSkillsRelativePath}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }
  }

  private async repairSkillsFromTemplates(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[]
  ): Promise<void> {
    const templateSkillNames = await this.getTemplateSkillNames();
    if (templateSkillNames.length === 0) {
      return;
    }

    for (const platformSkillsRelativePath of this.getSkillPlatforms(selectedAgentIds)) {
      const platformSkillsRoot = path.join(projectRoot, platformSkillsRelativePath);
      await fs.ensureDir(platformSkillsRoot);

      for (const skillName of templateSkillNames) {
        const sourceSkillDirectory = path.join(this.templateSkillsRoot, skillName);
        const destinationSkillDirectory = path.join(platformSkillsRoot, skillName);

        try {
          await fs.remove(destinationSkillDirectory);
          await fs.copy(sourceSkillDirectory, destinationSkillDirectory, {
            overwrite: true,
            errorOnExist: false,
          });
        } catch (error) {
          console.warn(
            `Warning: Failed to repair template skill '${skillName}' for ${platformSkillsRelativePath}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }
  }

  private async getSkillPlannedFileChanges(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[]
  ): Promise<PlannedFileChange[]> {
    const templateSkillNames = await this.getTemplateSkillNames();
    if (templateSkillNames.length === 0) {
      return [];
    }

    const changes: PlannedFileChange[] = [];
    for (const platformSkillsRelativePath of this.getSkillPlatforms(selectedAgentIds)) {
      for (const skillName of templateSkillNames) {
        const destinationSkillDirectory = path.join(
          projectRoot,
          platformSkillsRelativePath,
          skillName
        );
        const exists = await fs.pathExists(destinationSkillDirectory);
        changes.push({
          path: path.join(platformSkillsRelativePath, skillName).replace(/\\/g, "/"),
          action: exists ? "modify" : "create",
          description:
            "Sync Jumbo-managed skill from assets/skills (user-created skills are preserved)",
        });
      }
    }

    return changes;
  }

  private async getTemplateSkillNames(): Promise<string[]> {
    const exists = await fs.pathExists(this.templateSkillsRoot);
    if (!exists) {
      return [];
    }

    const entries = await fs.readdir(this.templateSkillsRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  }

  private getConfigurers(selectedAgentIds?: readonly AgentId[]): IConfigurer[] {
    if (!selectedAgentIds || selectedAgentIds.length === 0) {
      return this.configurers;
    }

    const selectedAgentIdSet = new Set(selectedAgentIds);
    return this.configurers.filter((configurer) => selectedAgentIdSet.has(configurer.agent.id));
  }

  private getSkillPlatforms(selectedAgentIds?: readonly AgentId[]): string[] {
    const skillPlatforms = new Set<string>();

    for (const configurer of this.getConfigurers(selectedAgentIds)) {
      for (const skillPlatform of configurer.skillPlatforms) {
        skillPlatforms.add(skillPlatform);
      }
    }

    return Array.from(skillPlatforms).sort((left, right) => left.localeCompare(right));
  }
}
