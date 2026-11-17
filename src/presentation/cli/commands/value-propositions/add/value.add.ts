/**
 * CLI Command: jumbo value add
 *
 * Adds a new value proposition to the project.
 *
 * Usage:
 *   jumbo value add --title "..." --description "..." --benefit "..." [--measurable-outcome "..."]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddValuePropositionController } from "../../../../../application/context/value-propositions/add/AddValuePropositionController.js";
import { AddValuePropositionRequest } from "../../../../../application/context/value-propositions/add/AddValuePropositionRequest.js";
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
      "jumbo value add --title 'Persistent context' --description 'Maintain context across sessions' --benefit 'Developers don\\'t lose work'",
    description: "Add a value proposition without measurable outcome",
  },
  {
    command:
      "jumbo value add --title 'Model-agnostic' --description 'Works with any LLM' --benefit 'Switch providers freely' --measurable-outcome 'Zero context loss'",
    description: "Add a value proposition with measurable outcome",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["value update", "value remove"];

/**
 * The abstract ports the `value add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ValueAddDependencies {
  readonly addValuePropositionController: AddValuePropositionController;
}

/**
 * Composes exactly the feature the `value add` leaf uses.
 */
async function createValueAddDependencies(): Promise<ValueAddDependencies> {
  return new LeafContainerBuilder().withValuePropositionFeature().build();
}

/** Registers the `value add` leaf under the parent supplied by its group. */
export function registerValueAddCommand(value: Command): void {
  const command = value
    .command("add")
    .description("Add a value proposition to the project")
    .option("-t, --title <title>", "Short value description")
    .option("-d, --description <description>", "Detailed explanation of the value")
    .option("--benefit <benefit>", "How this improves the situation")
    .option("--measurable-outcome <outcome>", "How success is measured (optional)");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "value add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ValueAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createValueAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Value add dependencies were not initialized.");
    await valueAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valueAdd(
  options: {
    title: string;
    description: string;
    benefit: string;
    measurableOutcome?: string;
  },
  container: ValueAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddValuePropositionRequest = {
      title: options.title,
      description: options.description,
      benefit: options.benefit,
      measurableOutcome: options.measurableOutcome,
    };

    const response =
      await container.addValuePropositionController.handle(request);

    const data: Record<string, string> = {
      valuePropositionId: response.valuePropositionId,
      title: response.title,
    };
    if (response.measurableOutcome) {
      data.measurableOutcome = response.measurableOutcome;
    }

    renderer.success("Value proposition added successfully", data);
  } catch (error) {
    renderer.error(
      "Failed to add value proposition",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
