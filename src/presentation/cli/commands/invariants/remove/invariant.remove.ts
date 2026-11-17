/**
 * CLI Command: jumbo invariant remove
 *
 * Removes an invariant from project knowledge.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveInvariantController } from "../../../../../application/context/invariants/remove/RemoveInvariantController.js";
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
    command: "jumbo invariant remove --id inv_001",
    description: "Remove an invariant by ID",
  },
];

const RELATED_COMMANDS = ["invariant add", "invariant update"];

/**
 * The abstract ports the `invariant remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface InvariantRemoveDependencies {
  readonly removeInvariantController: RemoveInvariantController;
}

/**
 * Composes exactly the features the `invariant remove` leaf uses.
 */
async function createInvariantRemoveDependencies(): Promise<InvariantRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveInvariantFeature().build();
}

/** Registers the `invariant remove` leaf under the parent supplied by its group. */
export function registerInvariantRemoveCommand(invariant: Command): void {
  const command = invariant
    .command("remove")
    .description("Remove an invariant from project knowledge")
    .requiredOption("-i, --id <id>", "Invariant ID to remove");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "invariant remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: InvariantRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createInvariantRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Invariant remove dependencies were not initialized.");
    }
    await invariantRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function invariantRemove(
  options: {
    id: string;
  },
  container: InvariantRemoveDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeInvariantController.handle({
      invariantId: options.id,
    });

    // Success output
    renderer.success(`Invariant '${response.title}' removed`, {
      invariantId: response.invariantId,
      title: response.title,
    });
  } catch (error) {
    renderer.error(
      "Failed to remove invariant",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
