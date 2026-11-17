/**
 * CLI Command: jumbo session end
 *
 * Ends the current active session with a focus summary.
 *
 * Usage:
 *   jumbo session end --focus "..." [--summary "..."]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { EndSessionController } from "../../../../../application/context/sessions/end/EndSessionController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: 'jumbo session end --focus "Completed authentication implementation"',
    description: "End session with focus summary",
  },
  {
    command: 'jumbo session end --focus "Bug fixes" --summary "Fixed 3 critical bugs"',
    description: "End session with detailed summary",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["session start", "sessions list"];

/**
 * The abstract ports the `session end` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface SessionEndDependencies {
  readonly endSessionController: EndSessionController;
}

/**
 * Composes exactly the features the `session end` leaf uses.
 */
async function createSessionEndDependencies(): Promise<SessionEndDependencies> {
  return new LeafContainerBuilder().withEndSessionFeature().build();
}

/** Registers the `session end` leaf under the parent supplied by its group. */
export function registerSessionEndCommand(session: Command): void {
  const command = session
    .command("end")
    .description("End the current active session")
    .requiredOption("-f, --focus <focus>", "Summary of what was accomplished")
    .option("--summary <text>", "Detailed session summary (optional)");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "session end",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: SessionEndDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createSessionEndDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Session end dependencies were not initialized.");
    await sessionEnd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionEnd(
  options: {
    focus: string;
    summary?: string;
  },
  container: SessionEndDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.endSessionController.handle({
      focus: options.focus,
      summary: options.summary,
    });

    const data: Record<string, string> = {
      sessionId: response.sessionId,
      focus: response.focus,
    };
    if (response.summary) {
      data.summary = response.summary;
    }

    renderer.success("Session ended", data);
  } catch (error) {
    renderer.error(
      "Failed to end session",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
