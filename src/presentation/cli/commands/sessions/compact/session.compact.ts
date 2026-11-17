/**
 * CLI Command: jumbo session compact
 *
 * Signals the agent to perform context compaction.
 * Triggers pause.forCompaction of the context workers claimed goal
 *
 * Usage:
 *   jumbo session compact
 */

import { exec } from "child_process";
import { promisify } from "util";
import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

const execAsync = promisify(exec);

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo session compact",
    description: "Trigger context compaction",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["session start", "session end"];

/** Registers the `session compact` leaf under the parent supplied by its group. */
export function registerSessionCompactCommand(session: Command): void {
  const command = session
    .command("compact")
    .description("Trigger context compaction");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "session compact",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  command.action(async (options) => {
    await sessionCompact(options);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionCompact(_options: Record<string, never>) {
  const renderer = Renderer.getInstance();

  try {
    renderer.info("Triggering /compact...\n");

    const { stdout, stderr } = await execAsync("/compact");

    if (stdout) {
      renderer.info(stdout);
    }
    if (stderr) {
      renderer.info(stderr);
    }

    renderer.success("Compact triggered", {});
  } catch (error) {
    renderer.error(
      "Failed to run /compact",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
