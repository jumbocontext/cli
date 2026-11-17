/**
 * Infrastructure: Mistral Vibe Configurer
 *
 * Encapsulates all knowledge about Mistral Vibe configuration:
 * - Skills distributed to .vibe/skills
 *
 * Vibe reads AGENTS.md natively and does not support lifecycle hooks,
 * so configuration is limited to skill distribution.
 *
 * Operations are idempotent and gracefully handle errors.
 */

import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

export class VibeConfigurer implements IConfigurer {
  readonly agent = {
    id: "vibe",
    name: "Vibe",
  } as const;

  readonly skillPlatforms = [".vibe/skills"] as const;

  /**
   * Configure all Mistral Vibe requirements for Jumbo.
   * Vibe reads AGENTS.md natively and has no hook system,
   * so no additional configuration files are needed.
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(_projectRoot: string): Promise<void> {
    // Vibe reads AGENTS.md natively - no additional files needed.
    // Skills are installed by AgentFileProtocol via skillPlatforms.
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(
    _projectRoot: string,
  ): Promise<PlannedFileChange[]> {
    return [];
  }
}
