/**
 * CLI Command: jumbo heal
 *
 * Rebuilds database projections from the event store.
 *
 * Usage:
 *   jumbo heal
 *   jumbo heal --yes
 */

import type { Command } from "commander";
import type { CommandExample } from "../registry/CommandMetadata.js";
import type { RebuildDatabaseController } from "../../../../application/maintenance/db/rebuild/RebuildDatabaseController.js";
import type { ILogger } from "../../../../application/logging/ILogger.js";
import { LeafContainerBuilder } from "../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../rendering/Renderer.js";
import { HealOutputBuilder } from "./HealOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../help/SubcommandHelpFormatter.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo heal",
    description: "Rebuild projections with confirmation prompt",
  },
  {
    command: "jumbo heal --yes",
    description: "Rebuild projections without confirmation",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["evolve"];

/**
 * The abstract ports the `heal` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface HealDependencies {
  readonly rebuildDatabaseController: RebuildDatabaseController;
  readonly logger: ILogger;
}

/**
 * Composes exactly the features the `heal` leaf uses.
 */
async function createHealDependencies(): Promise<HealDependencies> {
  return new LeafContainerBuilder().withRebuildDatabaseFeature().build();
}

/** Registers the standalone `heal` leaf directly on the root program. */
export function registerHealCommand(program: Command): void {
  const command = program
    .command("heal")
    .description("Rebuild database projections from the event store")
    .option(
      "--yes",
      "Skip confirmation prompt (required for non-interactive use)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "heal",
      metadata: metadataFromCommand(command, {
        category: undefined,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: HealDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createHealDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Heal dependencies were not initialized.");
    await heal(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function heal(
  options: { yes?: boolean },
  container: HealDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new HealOutputBuilder();
  const logger = container.logger;
  const tag = "[heal]";

  try {
    if (!options.yes) {
      const output = outputBuilder.buildConfirmationRequired();
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    logger.info(`${tag} Starting heal command`);
    const response = await container.rebuildDatabaseController.handle({
      skipConfirmation: options.yes,
    });
    logger.info(`${tag} Heal command completed`, {
      eventsReplayed: response.eventsReplayed,
      success: response.success,
    });

    const output = outputBuilder.buildSuccess(response);
    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      return;
    }

    renderer.data(outputBuilder.buildStructuredOutput(response));
  } catch (error) {
    logger.error(
      `${tag} Heal command failed`,
      error instanceof Error ? error : undefined,
      {
        errorValue: error instanceof Error ? undefined : String(error),
      },
    );
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
