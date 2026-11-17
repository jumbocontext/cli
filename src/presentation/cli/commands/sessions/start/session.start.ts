/**
 * CLI Command: jumbo session start
 *
 * Starts a new working session to track developer activity and provide context.
 *
 * Usage:
 *   jumbo session start
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { SessionStartController } from "../../../../../application/context/sessions/start/SessionStartController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { SessionStartOutputBuilder } from "./SessionStartOutputBuilder.js";
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
    command: "jumbo session start",
    description: "Start a new working session",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["session end", "sessions list"];

/**
 * The abstract ports the `session start` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface SessionStartDependencies {
  readonly sessionStartController: SessionStartController;
}

/**
 * Composes exactly the features the `session start` leaf uses.
 */
async function createSessionStartDependencies(): Promise<SessionStartDependencies> {
  return new LeafContainerBuilder().withSessionStartFeature().build();
}

/** Registers the `session start` leaf under the parent supplied by its group. */
export function registerSessionStartCommand(session: Command): void {
  const command = session
    .command("start")
    .description("Start a new working session");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "session start",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: SessionStartDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createSessionStartDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Session start dependencies were not initialized.");
    await sessionStart(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 *
 * Responsibilities (presentation layer only):
 * - Call SessionStartController for orchestrated session start
 * - Render the result via SessionStartOutputBuilder
 *
 * Orchestration is delegated to SessionStartController in the application layer.
 */
export async function sessionStart(
  options: Record<string, never>,
  container: SessionStartDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const config = renderer.getConfig();
    const isTextOutput = config.format === "text";

    // 1. CONTROLLER: Orchestrate session start
    const response = await container.sessionStartController.handle({});

    // 2. RENDER: Display context and result
    const outputBuilder = new SessionStartOutputBuilder();

    if (isTextOutput) {
      const output = outputBuilder.buildSessionStartOutput(response);
      renderer.info(output.toHumanReadable());

      renderer.success("Session started", {
        sessionId: response.sessionId,
      });
    } else {
      renderer.data(outputBuilder.buildStructuredOutput(response));
    }
  } catch (error) {
    renderer.error(
      "Failed to start session",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
