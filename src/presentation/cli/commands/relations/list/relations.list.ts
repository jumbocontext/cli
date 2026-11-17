/**
 * CLI Command: jumbo relations list
 *
 * Lists all knowledge graph relations with optional entity filtering.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetRelationsController } from "../../../../../application/context/relations/get/GetRelationsController.js";
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
import { GetRelationsRequest } from "../../../../../application/context/relations/get/GetRelationsRequest.js";
import { RelationListOutputBuilder } from "./RelationListOutputBuilder.js";
import { RelationDirection } from "../../../../../application/context/relations/get/RelationDirection.js";
import { RelationStatusFilter } from "../../../../../application/context/relations/get/RelationStatusFilter.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo relations list",
    description: "List all active relations",
  },
  {
    command: "jumbo relations list --entity-type goal",
    description: "List relations involving goals",
  },
  {
    command:
      "jumbo relations list --entity-type component --entity-id comp_123",
    description: "List relations for a specific component",
  },
  {
    command: "jumbo relations list --status deactivated",
    description: "List only deactivated relations",
  },
  {
    command: "jumbo relations list --status all",
    description: "List all relations including removed",
  },
  {
    command: "jumbo relations list --format json",
    description: "List relations as JSON",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["relation add", "relation remove"];

/**
 * The abstract ports the `relations list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface RelationsListDependencies {
  readonly getRelationsController: GetRelationsController;
}

/**
 * Composes exactly the features the `relations list` leaf uses.
 */
async function createRelationsListDependencies(): Promise<RelationsListDependencies> {
  return new LeafContainerBuilder().withGetRelationsFeature().build();
}

/** Registers the `relations list` leaf under the parent supplied by its group. */
export function registerRelationsListCommand(relations: Command): void {
  const command = relations
    .command("list")
    .description("List all knowledge graph relations")
    .option(
      "--entity-type <type>",
      "Filter by entity type (e.g., goal, decision, component)",
    )
    .option("--entity-id <id>", "Filter by entity ID")
    .option(
      "-d, --direction <direction>",
      "Filter relative to the entity: in, out, or both (default)",
    )
    .option("--relation-type <type>", "Filter by relation type")
    .option(
      "--related-entity-type <type>",
      "Filter by the type at the opposite endpoint",
    )
    .option(
      "--strength <strength>",
      "Filter by strength: strong, medium, or weak",
    )
    .option(
      "-s, --status <status>",
      "Filter by status: active (default), deactivated, removed, or all",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "relations list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.relations,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: RelationsListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createRelationsListDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Relations list dependencies were not initialized.");
    }
    await relationsList(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function relationsList(
  options: {
    entityType?: string;
    entityId?: string;
    direction?: string;
    relationType?: string;
    relatedEntityType?: string;
    strength?: string;
    status?: string;
  },
  container: RelationsListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: GetRelationsRequest = {
      entity:
        options.entityType && options.entityId
          ? {
              entityType: options.entityType as EntityTypeValue,
              entityId: options.entityId,
            }
          : undefined,
      entityType: options.entityType as EntityTypeValue | undefined,
      entityId: options.entityId,
      direction: options.direction as RelationDirection | undefined,
      relationType: options.relationType,
      relatedEntityType: options.relatedEntityType as
        EntityTypeValue | undefined,
      strength: options.strength as RelationStrengthValue | undefined,
      status: (options.status as RelationStatusFilter | undefined) ?? "active",
    };
    const { relations } =
      await container.getRelationsController.handle(request);

    const config = renderer.getConfig();
    const outputBuilder = new RelationListOutputBuilder();

    if (config.format === "text") {
      const filterLabel = options.entityType
        ? `${options.entityType}${options.entityId ? ":" + options.entityId : ""}`
        : undefined;
      const output = outputBuilder.build(relations, filterLabel);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(relations, request);
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output = new RelationListOutputBuilder().buildFailureError(
      error instanceof Error ? error : String(error),
    );
    const config = renderer.getConfig();
    if (config.format === "text") {
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
