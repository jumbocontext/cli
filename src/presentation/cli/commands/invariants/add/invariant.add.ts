/**
 * CLI Command: jumbo invariant add
 *
 * Captures a non-negotiable requirement or boundary for the project.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddInvariantController } from "../../../../../application/context/invariants/add/AddInvariantController.js";
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
    command:
      "jumbo invariant add --title 'HTTPS only' --description 'All API calls must use HTTPS'",
    description: "Add a security invariant",
  },
  {
    command:
      "jumbo invariant add --title '80% test coverage' --description 'All code must have at least 80% test coverage' --rationale 'Ensures code quality'",
    description: "Add a testing invariant with rationale",
  },
];

const RELATED_COMMANDS = ["invariant update", "invariant remove", "guideline add"];

/**
 * The abstract ports the `invariant add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface InvariantAddDependencies {
  readonly addInvariantController: AddInvariantController;
}

/**
 * Composes exactly the features the `invariant add` leaf uses.
 */
async function createInvariantAddDependencies(): Promise<InvariantAddDependencies> {
  return new LeafContainerBuilder().withAddInvariantFeature().build();
}

/** Registers the `invariant add` leaf under the parent supplied by its group. */
export function registerInvariantAddCommand(invariant: Command): void {
  const command = invariant
    .command("add")
    .description("Add a project invariant (non-negotiable requirement)")
    .requiredOption("-t, --title <title>", "Invariant title")
    .requiredOption(
      "-d, --description <description>",
      "Detailed description of the invariant",
    )
    .option("-r, --rationale <rationale>", "Why this invariant is non-negotiable");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "invariant add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: InvariantAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createInvariantAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Invariant add dependencies were not initialized.");
    }
    await invariantAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function invariantAdd(
  options: {
    title: string;
    description: string;
    rationale?: string;
  },
  container: InvariantAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const { invariantId } = await container.addInvariantController.handle({
      title: options.title,
      description: options.description,
      rationale: options.rationale,
    });

    const data: Record<string, string> = {
      invariantId,
      title: options.title,
    };
    if (options.rationale) {
      data.rationale = options.rationale;
    }

    renderer.success(`Invariant '${options.title}' added`, data);
  } catch (error) {
    renderer.error(
      "Failed to add invariant",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
