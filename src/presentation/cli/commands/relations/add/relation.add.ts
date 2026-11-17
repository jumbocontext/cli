/**
 * CLI Command: jumbo relation add
 *
 * Creates a directed relationship between two entities in the knowledge graph.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddRelationController } from "../../../../../application/context/relations/add/AddRelationController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { AddRelationRequest } from "../../../../../application/context/relations/add/AddRelationRequest.js";
import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../../domain/relations/Constants.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command:
      "jumbo relation add --from-type goal --from-id auth-impl --to-type component --to-id TokenService --type involves --description 'Goal requires TokenService implementation'",
    description: "Link a goal to a component it involves",
  },
  {
    command:
      "jumbo relation add --from-type component --from-id TokenService --to-type dependency --to-id jsonwebtoken --type uses --strength strong --description 'TokenService critically depends on jsonwebtoken'",
    description: "Link a component to its dependency with strength",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["relation remove", "relations list"];

/**
 * The abstract ports the `relation add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface RelationAddDependencies {
  readonly addRelationController: AddRelationController;
}

/**
 * Composes exactly the features the `relation add` leaf uses.
 */
async function createRelationAddDependencies(): Promise<RelationAddDependencies> {
  return new LeafContainerBuilder().withAddRelationFeature().build();
}

/** Registers the `relation add` leaf under the parent supplied by its group. */
export function registerRelationAddCommand(relation: Command): void {
  const command = relation
    .command("add")
    .description("Add a relationship between two entities in the knowledge graph")
    .requiredOption(
      "--from-type <fromType>",
      "Source entity type (e.g., goal, component, dependency)",
    )
    .requiredOption("--from-id <fromId>", "Source entity ID")
    .requiredOption(
      "--to-type <toType>",
      "Target entity type (e.g., goal, component, dependency)",
    )
    .requiredOption("--to-id <toId>", "Target entity ID")
    .requiredOption(
      "-T, --type <type>",
      "Type of relationship (e.g., involves, uses, depends-on)",
    )
    .requiredOption(
      "-d, --description <description>",
      "Human-readable explanation of the relationship",
    )
    .option("--strength <strength>", "Relationship strength: strong, medium, or weak");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "relation add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.relations,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: RelationAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createRelationAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Relation add dependencies were not initialized.");
    }
    await relationAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function relationAdd(
  options: {
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
    type: string;
    description: string;
    strength?: string;
  },
  container: RelationAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddRelationRequest = {
      fromEntityType: options.fromType as EntityTypeValue,
      fromEntityId: options.fromId,
      toEntityType: options.toType as EntityTypeValue,
      toEntityId: options.toId,
      relationType: options.type,
      description: options.description,
      strength: options.strength as RelationStrengthValue | undefined,
    };

    const { relationId } =
      await container.addRelationController.handle(request);

    const data: Record<string, string> = {
      relationId,
      from: `${options.fromType}:${options.fromId}`,
      relationType: options.type,
      to: `${options.toType}:${options.toId}`,
    };
    if (options.strength) {
      data.strength = options.strength;
    }

    renderer.success("Relation added successfully", data);
  } catch (error) {
    renderer.error(
      "Failed to add relation",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
