/**
 * CLI Command: jumbo relations traverse
 *
 * Traverses bounded relation context from an entity.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { TraverseRelationsController } from "../../../../../application/context/relations/traverse/TraverseRelationsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../../domain/relations/Constants.js";
import { RelationDirection } from "../../../../../application/context/relations/get/RelationDirection.js";
import { RelationStatusFilter } from "../../../../../application/context/relations/get/RelationStatusFilter.js";
import { TraverseRelationsRequest } from "../../../../../application/context/relations/traverse/TraverseRelationsRequest.js";
import { RelationTraverseOutputBuilder } from "./RelationTraverseOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo relations traverse --id goal_123",
    description: "Inspect the immediate active context",
  },
  {
    command:
      "jumbo relations traverse --id goal_123 --entity-type goal --depth 3",
    description: "Traverse three hops from a typed root",
  },
  {
    command:
      "jumbo relations traverse --id comp_123 --direction out --relation-type requires --format json",
    description: "Return filtered outgoing context as JSON",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["relations list", "relation add", "relation remove"];

/**
 * The abstract ports the `relations traverse` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface RelationsTraverseDependencies {
  readonly traverseRelationsController: TraverseRelationsController;
}

/**
 * Composes exactly the features the `relations traverse` leaf uses.
 */
async function createRelationsTraverseDependencies(): Promise<RelationsTraverseDependencies> {
  return new LeafContainerBuilder().withTraverseRelationsFeature().build();
}

/** Registers the `relations traverse` leaf under the parent supplied by its group. */
export function registerRelationsTraverseCommand(relations: Command): void {
  const command = relations
    .command("traverse")
    .description("Traverse bounded relation context from an entity")
    .requiredOption("-i, --id <id>", "Entity ID at the traversal root")
    .option(
      "--entity-type <type>",
      "Root entity type (inferred when the ID is unique)",
    )
    .option("--depth <depth>", "Traversal depth from 1 through 5", "1")
    .option("-d, --direction <direction>", "Direction: in, out, or both", "both")
    .option("--relation-type <type>", "Filter by relation type")
    .option(
      "--related-entity-type <type>",
      "Filter each expansion by opposite endpoint type",
    )
    .option(
      "--strength <strength>",
      "Filter by strength: strong, medium, or weak",
    )
    .option(
      "-s, --status <status>",
      "Filter by status: active, deactivated, removed, or all",
      "active",
    )
    .option(
      "--limit <limit>",
      "Maximum number of distinct edges from 1 through 1000",
      "100",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "relations traverse",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.relations,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: RelationsTraverseDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createRelationsTraverseDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Relations traverse dependencies were not initialized.");
    }
    await relationsTraverse(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function relationsTraverse(
  options: {
    id: string;
    entityType?: string;
    depth?: string;
    direction?: string;
    relationType?: string;
    relatedEntityType?: string;
    strength?: string;
    status?: string;
    limit?: string;
  },
  container: RelationsTraverseDependencies,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new RelationTraverseOutputBuilder();

  try {
    const request: TraverseRelationsRequest = {
      entityId: options.id,
      entityType: options.entityType as EntityTypeValue | undefined,
      depth: Number(options.depth ?? 1),
      direction: (options.direction as RelationDirection | undefined) ?? "both",
      relationType: options.relationType,
      relatedEntityType: options.relatedEntityType as
        EntityTypeValue | undefined,
      strength: options.strength as RelationStrengthValue | undefined,
      status: (options.status as RelationStatusFilter | undefined) ?? "active",
      limit: Number(options.limit ?? 100),
    };
    const result = await container.traverseRelationsController.handle(request);

    if (renderer.getConfig().format === "text") {
      renderer.info(outputBuilder.build(result).toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(result);
      const dataSection = output
        .getSections()
        .find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    if (renderer.getConfig().format === "text") {
      renderer.error(output.toHumanReadable());
    } else {
      const dataSection = output
        .getSections()
        .find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
    process.exit(1);
  }
}
