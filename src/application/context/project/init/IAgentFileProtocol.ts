/**
 * Port: Agent File Protocol
 *
 * Defines interface for managing AI agent instruction files and configuration
 * during project initialization.
 *
 * Responsibilities:
 * - Ensure JUMBO.md exists with full Jumbo instructions
 * - Ensure AGENTS.md exists with thin reference to JUMBO.md
 * - Ensure all supported agents are configured
 * - Report planned file changes for preview before execution
 *
 * Design Notes:
 * - Operations are idempotent (safe to run multiple times)
 * - Side effects only (no domain events emitted)
 * - Errors logged but don't fail initialization (graceful degradation)
 * - Agent-specific knowledge is encapsulated in individual Configurer classes
 */

import { AgentId, AvailableAgent } from "./AgentSelection.js";
import { PlannedFileChange } from "./PlannedFileChange.js";

export interface IAgentFileProtocol {
  /**
   * Ensure JUMBO.md exists with full Jumbo instructions.
   *
   * Behavior:
   * - If JUMBO.md doesn't exist: Create it with full content
   * - If JUMBO.md exists with Jumbo section: Replace with current version
   * - If JUMBO.md exists without Jumbo section: Append current Jumbo section
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureJumboMd(projectRoot: string): Promise<void>;

  /**
   * Ensure AGENTS.md exists with thin reference to JUMBO.md.
   *
   * Behavior:
   * - If AGENTS.md doesn't exist: Create it with thin reference content
   * - If AGENTS.md exists without Jumbo Instructions: Append thin reference section
   * - If AGENTS.md exists with Jumbo Instructions section: Replace with thin reference
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureAgentsMd(projectRoot: string): Promise<void>;

  /**
   * Ensure all supported agents are configured for Jumbo.
   *
   * Orchestrates configuration for all supported agents by delegating
   * to each agent's dedicated Configurer class and by distributing
   * all template-managed skills from assets/skills/ into each
   * configured platform skill directory.
   *
   * Behavior:
   * - Delegates to each agent's Configurer
   * - Installs template-managed skills additively for each platform
   * - Each Configurer handles its own error recovery
   * - Failures in one agent don't affect others
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureAgentConfigurations(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[],
  ): Promise<void>;

  /**
   * Repair JUMBO.md by replacing the Jumbo section with the current version.
   *
   * Behavior:
   * - If JUMBO.md doesn't exist: Create it with full content
   * - If JUMBO.md exists with Jumbo section: Replace section with current version
   * - If JUMBO.md exists without Jumbo section: Append current Jumbo section
   *
   * @param projectRoot Absolute path to project root directory
   */
  repairJumboMd(projectRoot: string): Promise<void>;

  /**
   * Repair AGENTS.md by replacing the Jumbo section with the current thin reference.
   *
   * Behavior:
   * - If AGENTS.md doesn't exist: Create it with thin reference content
   * - If AGENTS.md exists with Jumbo section: Replace section with thin reference
   * - If AGENTS.md exists without Jumbo section: Append thin reference section
   *
   * @param projectRoot Absolute path to project root directory
   */
  repairAgentsMd(projectRoot: string): Promise<void>;

  /**
   * Repair all supported agent configurations.
   *
   * Orchestrates repair for all supported agents by delegating to each
   * agent's dedicated Configurer class, then overwrites all
   * template-managed skills from assets/skills/ for each configured
   * platform directory. Uses repair() if available, otherwise falls
   * back to configure().
   *
   * @param projectRoot Absolute path to project root directory
   */
  repairAgentConfigurations(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[],
  ): Promise<void>;

  /**
   * Return the available agents derived from the registered configurers.
   */
  getAvailableAgents(): readonly AvailableAgent[];

  /**
   * Get all planned file changes without executing.
   * Use this for preview before user confirmation.
   *
   * Includes:
   * - JUMBO.md (create or modify)
   * - AGENTS.md (create or modify)
   * - All agent-specific files from configurers
   *
   * @param projectRoot Absolute path to project root directory
   * @returns List of planned file changes
   */
  getPlannedFileChanges(
    projectRoot: string,
    selectedAgentIds?: readonly AgentId[],
  ): Promise<PlannedFileChange[]>;
}
