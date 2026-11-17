/**
 * CLI Command: jumbo relations path
 *
 * Finds one bounded shortest path between two relation endpoints.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { FindRelationPathController } from "../../../../../application/context/relations/path/FindRelationPathController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { FindRelationPathRequest } from "../../../../../application/context/relations/path/FindRelationPathRequest.js";
import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../../domain/relations/Constants.js";
import { RelationDirection } from "../../../../../application/context/relations/get/RelationDirection.js";
import { RelationStatusFilter } from "../../../../../application/context/relations/get/RelationStatusFilter.js";
import { RelationPathOutputBuilder } from "./RelationPathOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command:
      "jumbo relations path --from-type goal --from-id goal_123 --to-type dependency --to-id dep_456",
    description: "Explain the shortest connection between two typed memories",
  },
  {
    command:
      "jumbo relations path --from-id goal_123 --to-id comp_456 --direction out --max-depth 3 --format json",
    description:
      "Resolve unique endpoint types and return an outgoing path as JSON",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["relations traverse", "relations list", "relation add"];

/**
 * The abstract ports the `relations path` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface RelationsPathDependencies {
  readonly findRelationPathController: FindRelationPathController;
}

/**
 * Composes exactly the features the `relations path` leaf uses.
 */
async function createRelationsPathDependencies(): Promise<RelationsPathDependencies> {
  return new LeafContainerBuilder().withFindRelationPathFeature().build();
}

/** Registers the `relations path` leaf under the parent supplied by its group. */
export function registerRelationsPathCommand(relations: Command): void {
  const command = relations
    .command("path")
    .description("Find one bounded shortest path between two relation endpoints")
    .requiredOption("--from-id <fromId>", "Starting entity ID")
    .requiredOption("--to-id <toId>", "Destination entity ID")
    .option(
      "--from-type <fromType>",
      "Starting entity type (inferred when the ID is unique)",
    )
    .option(
      "--to-type <toType>",
      "Destination entity type (inferred when the ID is unique)",
    )
    .option("--max-depth <maxDepth>", "Maximum path depth from 1 through 5", "5")
    .option("-d, --direction <direction>", "Direction: in, out, or both", "both")
    .option("--relation-type <type>", "Filter by relation type")
    .option(
      "--entity-type <type>",
      "Filter each traversed opposite endpoint by entity type",
    )
    .option(
      "--strength <strength>",
      "Filter by strength: strong, medium, or weak",
    )
    .option(
      "-s, --status <status>",
      "Filter by status: active, deactivated, removed, or all",
      "active",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "relations path",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.relations,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: RelationsPathDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createRelationsPathDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Relations path dependencies were not initialized.");
    }
    await relationsPath(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function relationsPath(
  options: {
    fromId: string;
    fromType?: string;
    toId: string;
    toType?: string;
    maxDepth?: string;
    direction?: string;
    relationType?: string;
    entityType?: string;
    strength?: string;
    status?: string;
  },
  container: RelationsPathDependencies,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new RelationPathOutputBuilder();

  try {
    const request: FindRelationPathRequest = {
      fromEntityId: options.fromId,
      fromEntityType: options.fromType as EntityTypeValue | undefined,
      toEntityId: options.toId,
      toEntityType: options.toType as EntityTypeValue | undefined,
      maxDepth: Number(options.maxDepth ?? 5),
      direction: (options.direction as RelationDirection | undefined) ?? "both",
      relationType: options.relationType,
      relatedEntityType: options.entityType as EntityTypeValue | undefined,
      strength: options.strength as RelationStrengthValue | undefined,
      status: (options.status as RelationStatusFilter | undefined) ?? "active",
    };
    const result = await container.findRelationPathController.handle(request);

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
