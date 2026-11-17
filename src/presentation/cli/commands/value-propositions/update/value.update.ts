/**
 * CLI Command: jumbo value update
 *
 * Updates an existing value proposition in the project.
 *
 * Usage:
 *   jumbo value update --id <valuePropositionId> [--title "..."] [--description "..."] [--benefit "..."]
 *   jumbo value update --id <valuePropositionId> --measurable-outcome "..."
 *   jumbo value update --id <valuePropositionId> --clear-measurable-outcome
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateValuePropositionController } from "../../../../../application/context/value-propositions/update/UpdateValuePropositionController.js";
import { UpdateValuePropositionRequest } from "../../../../../application/context/value-propositions/update/UpdateValuePropositionRequest.js";
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
    command: "jumbo value update --id value_123 --title 'New Title'",
    description: "Update just the title",
  },
  {
    command:
      "jumbo value update --id value_123 --description 'Updated description' --benefit 'New benefit'",
    description: "Update multiple fields",
  },
  {
    command: "jumbo value update --id value_123 --clear-measurable-outcome",
    description: "Clear the measurable outcome field",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["value add", "value remove"];

/**
 * The abstract ports the `value update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ValueUpdateDependencies {
  readonly updateValuePropositionController: UpdateValuePropositionController;
}

/**
 * Composes exactly the feature the `value update` leaf uses.
 */
async function createValueUpdateDependencies(): Promise<ValueUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateValuePropositionFeature().build();
}

/** Registers the `value update` leaf under the parent supplied by its group. */
export function registerValueUpdateCommand(value: Command): void {
  const command = value
    .command("update")
    .description("Update an existing value proposition")
    .option("-i, --id <id>", "ID of the value proposition to update")
    .option(
      "-t, --title <title>",
      "Updated title, max 100 chars (at least one field required)",
    )
    .option(
      "-d, --description <description>",
      "Updated description, max 1000 chars (at least one field required)",
    )
    .option(
      "--benefit <benefit>",
      "Updated benefit, max 500 chars (at least one field required)",
    )
    .option(
      "--measurable-outcome <measurableOutcome>",
      "Updated measurable outcome, max 500 chars (at least one field required)",
    )
    .option(
      "--clear-measurable-outcome",
      "Clear the measurable outcome field (at least one field required)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "value update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ValueUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createValueUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Value update dependencies were not initialized.");
    await valueUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valueUpdate(
  options: {
    id: string;
    title?: string;
    description?: string;
    benefit?: string;
    measurableOutcome?: string;
    clearMeasurableOutcome?: boolean;
  },
  container: ValueUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  // Validate at least one field provided
  if (
    !options.title &&
    !options.description &&
    !options.benefit &&
    !options.measurableOutcome &&
    !options.clearMeasurableOutcome
  ) {
    renderer.error(
      "Must provide at least one field to update (--title, --description, --benefit, --measurable-outcome, or --clear-measurable-outcome)",
    );
    process.exit(1);
  }

  try {
    const request: UpdateValuePropositionRequest = {
      id: options.id,
      title: options.title,
      description: options.description,
      benefit: options.benefit,
      measurableOutcome: options.clearMeasurableOutcome
        ? null
        : options.measurableOutcome,
    };

    const response =
      await container.updateValuePropositionController.handle(request);

    const data: Record<string, string> = {
      valuePropositionId: response.valuePropositionId,
    };

    if (response.title) {
      data.title = response.title;
    }
    if (response.version !== undefined) {
      data.version = response.version.toString();
    }

    renderer.success("Value proposition updated successfully", data);
  } catch (error) {
    renderer.error(
      "Failed to update value proposition",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
