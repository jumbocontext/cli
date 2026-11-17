/**
 * CLI Command: jumbo invariant update
 *
 * Updates an existing invariant with new property values.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateInvariantController } from "../../../../../application/context/invariants/update/UpdateInvariantController.js";
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
    command: "jumbo invariant update --id inv_123 --title 'New Title'",
    description: "Update only the title",
  },
  {
    command:
      "jumbo invariant update --id inv_123 --title 'HTTPS Only' --description 'All API calls must use HTTPS'",
    description: "Update multiple fields",
  },
];

const RELATED_COMMANDS = ["invariant add", "invariant remove"];

/**
 * The abstract ports the `invariant update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface InvariantUpdateDependencies {
  readonly updateInvariantController: UpdateInvariantController;
}

/**
 * Composes exactly the features the `invariant update` leaf uses.
 */
async function createInvariantUpdateDependencies(): Promise<InvariantUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateInvariantFeature().build();
}

/** Registers the `invariant update` leaf under the parent supplied by its group. */
export function registerInvariantUpdateCommand(invariant: Command): void {
  const command = invariant
    .command("update")
    .description("Update an existing invariant")
    .requiredOption("-i, --id <id>", "ID of the invariant to update")
    .option("-t, --title <title>", "Updated invariant title")
    .option("-d, --description <description>", "Updated description")
    .option("-r, --rationale <rationale>", "Updated rationale");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "invariant update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: InvariantUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createInvariantUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Invariant update dependencies were not initialized.");
    }
    await invariantUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function invariantUpdate(
  options: {
    id: string;
    title?: string;
    description?: string;
    rationale?: string;
  },
  container: InvariantUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateInvariantController.handle({
      invariantId: options.id,
      ...(options.title !== undefined && { title: options.title }),
      ...(options.description !== undefined && {
        description: options.description,
      }),
      ...(options.rationale !== undefined && { rationale: options.rationale }),
    });

    // Success output
    const data: Record<string, string | number> = {
      invariantId: response.invariantId,
      updatedFields: response.updatedFields.join(", "),
    };

    if (response.title !== undefined) data.title = response.title;
    if (response.version !== undefined) data.version = response.version;

    renderer.success(
      `Invariant '${response.title || options.id}' updated`,
      data,
    );
  } catch (error) {
    renderer.error(
      "Failed to update invariant",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
