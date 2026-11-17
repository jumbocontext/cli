/**
 * CLI Command: jumbo relation remove
 *
 * Removes an existing relation from the knowledge graph.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveRelationController } from "../../../../../application/context/relations/remove/RemoveRelationController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { RemoveRelationRequest } from "../../../../../application/context/relations/remove/RemoveRelationRequest.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo relation remove --id rel_abc123",
    description: "Remove a relation",
  },
  {
    command:
      'jumbo relation remove --id rel_abc123 --reason "Component was deprecated"',
    description: "Remove a relation with a reason",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["relation add"];

/**
 * The abstract ports the `relation remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface RelationRemoveDependencies {
  readonly removeRelationController: RemoveRelationController;
}

/**
 * Composes exactly the features the `relation remove` leaf uses.
 */
async function createRelationRemoveDependencies(): Promise<RelationRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveRelationFeature().build();
}

/** Registers the `relation remove` leaf under the parent supplied by its group. */
export function registerRelationRemoveCommand(relation: Command): void {
  const command = relation
    .command("remove")
    .description("Remove a relation from the knowledge graph")
    .requiredOption("-i, --id <id>", "ID of the relation to remove")
    .option("-r, --reason <reason>", "Reason for removing the relation");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "relation remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.relations,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: RelationRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createRelationRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Relation remove dependencies were not initialized.");
    }
    await relationRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function relationRemove(
  options: {
    id: string;
    reason?: string;
  },
  container: RelationRemoveDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: RemoveRelationRequest = {
      relationId: options.id,
      reason: options.reason,
    };

    const response = await container.removeRelationController.handle(request);

    const data: Record<string, string> = {
      relationId: response.relationId,
    };

    if (response.from) {
      data.from = response.from;
    }
    if (response.relationType) {
      data.relationType = response.relationType;
    }
    if (response.to) {
      data.to = response.to;
    }
    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success("Relation removed successfully", data);
  } catch (error) {
    renderer.error(
      "Failed to remove relation",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
