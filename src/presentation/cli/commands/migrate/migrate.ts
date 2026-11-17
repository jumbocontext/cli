/**
 * CLI Command: jumbo migrate
 *
 * Copies a legacy project's .jumbo storage into the per-user application root.
 *
 * Standalone protocol: no workspace guard, project container, or project
 * services. Runs directly against the legacy installation on disk.
 */

import type { Command } from "commander";
import { LegacyInstallationMigrator } from "../../../../migration/LegacyInstallationMigrator.js";
import { Renderer } from "../../rendering/Renderer.js";
import type { CommandExample } from "../registry/CommandMetadata.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../help/SubcommandHelpFormatter.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo migrate",
    description:
      "Migrate from the legacy project root, retaining the original artifacts",
  },
];

/**
 * Registers the standalone `migrate` leaf directly on the root program.
 */
export function registerMigrateCommand(program: Command): void {
  const command = program
    .command("migrate")
    .description(
      "Copy this project's legacy .jumbo storage into the per-user application root (stop legacy Jumbo processes first)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "migrate",
      metadata: metadataFromCommand(command, {
        examples: EXAMPLES,
      }),
    });

  command.action(async () => {
    await migrate();
  });
}

/**
 * Command handler
 * Called by Commander after selection and validation.
 */
export async function migrate(): Promise<void> {
  try {
    const destination = await new LegacyInstallationMigrator().migrate();
    const renderer = Renderer.getInstance();
    renderer.success(
      `Legacy project copied to ${destination}. Original .jumbo artifacts were retained.`,
    );
  } catch (error) {
    const renderer = Renderer.getInstance();
    renderer.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
