/**
 * CLI Command: jumbo evolve
 *
 * Updates skills, configuration, and database to the current version.
 *
 * Usage:
 *   jumbo evolve --yes
 */

import type { Command } from "commander";
import type { CommandExample } from "../registry/CommandMetadata.js";
import type { EvolveController } from "../../../../application/evolve/EvolveController.js";
import type { ILogger } from "../../../../application/logging/ILogger.js";
import { LeafContainerBuilder } from "../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../rendering/Renderer.js";
import { EvolveOutputBuilder } from "./EvolveOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo evolve --yes",
    description: "Update the local Jumbo installation to the current version",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["heal", "project init"];

/**
 * The abstract ports the `evolve` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface EvolveDependencies {
  readonly evolveController: EvolveController;
  readonly logger: ILogger;
}

/**
 * Composes exactly the features the `evolve` leaf uses.
 */
async function createEvolveDependencies(): Promise<EvolveDependencies> {
  return new LeafContainerBuilder().withEvolveFeature().build();
}

/** Registers the standalone `evolve` leaf directly on the root program. */
export function registerEvolveCommand(program: Command): void {
  const command = program
    .command("evolve")
    .description("Update skills, configuration, and database to the current version")
    .option(
      "--yes",
      "Skip confirmation prompt (required for non-interactive use)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "evolve",
      metadata: metadataFromCommand(command, {
        category: undefined,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: EvolveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createEvolveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Evolve dependencies were not initialized.");
    await evolve(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function evolve(
  options: { yes?: boolean },
  container: EvolveDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new EvolveOutputBuilder();
  const logger = container.logger;
  const tag = "[evolve]";

  try {
    if (!options.yes) {
      renderer.info(
        outputBuilder.buildConfirmationRequired().toHumanReadable(),
      );
      process.exit(1);
    }

    const response = await container.evolveController.handle();
    logger.info(`${tag} Evolve command completed`, {
      steps: response.steps.map((s) => ({ name: s.name, status: s.status })),
    });
    renderer.info(outputBuilder.buildSuccess(response.steps).toHumanReadable());
  } catch (error) {
    logger.error(
      `${tag} Evolve command failed`,
      error instanceof Error ? error : undefined,
      {
        errorValue: error instanceof Error ? undefined : String(error),
      },
    );
    renderer.info(
      outputBuilder
        .buildFailureError(error instanceof Error ? error : String(error))
        .toHumanReadable(),
    );
    process.exit(1);
  }
}
