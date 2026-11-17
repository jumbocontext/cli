/**
 * CLI Command: jumbo value remove
 *
 * Removes a value proposition from the project.
 *
 * Usage:
 *   jumbo value remove --id <valuePropositionId>
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveValuePropositionController } from "../../../../../application/context/value-propositions/remove/RemoveValuePropositionController.js";
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
    command: "jumbo value remove --id value_abc123",
    description: "Remove a value proposition by ID",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["value add", "value update"];

/**
 * The abstract ports the `value remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ValueRemoveDependencies {
  readonly removeValuePropositionController: RemoveValuePropositionController;
}

/**
 * Composes exactly the feature the `value remove` leaf uses.
 */
async function createValueRemoveDependencies(): Promise<ValueRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveValuePropositionFeature().build();
}

/** Registers the `value remove` leaf under the parent supplied by its group. */
export function registerValueRemoveCommand(value: Command): void {
  const command = value
    .command("remove")
    .description("Remove a value proposition from the project")
    .option("-i, --id <id>", "ID of the value proposition to remove");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "value remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ValueRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createValueRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Value remove dependencies were not initialized.");
    await valueRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valueRemove(
  options: {
    id: string;
  },
  container: ValueRemoveDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeValuePropositionController.handle({
      valuePropositionId: options.id,
    });

    // Success output
    renderer.success("Value proposition removed successfully", {
      valuePropositionId: response.valuePropositionId,
      title: response.title,
    });
  } catch (error) {
    renderer.error(
      "Failed to remove value proposition",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
