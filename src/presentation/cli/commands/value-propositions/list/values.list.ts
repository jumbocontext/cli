/**
 * CLI Command: jumbo values list
 *
 * Lists all value propositions for the project.
 *
 * Usage:
 *   jumbo values list
 *   jumbo values list --format json
 *   jumbo values list --format yaml
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetValuePropositionsController } from "../../../../../application/context/value-propositions/get/GetValuePropositionsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { ValueListOutputBuilder } from "./ValueListOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo values list",
    description: "List all value propositions in text format",
  },
  {
    command: "jumbo values list --format json",
    description: "List all value propositions as JSON",
  },
  {
    command: "jumbo values list --format yaml",
    description: "List all value propositions as YAML",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["value add", "value update", "value remove"];

/**
 * The abstract ports the `values list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ValuesListDependencies {
  readonly getValuePropositionsController: GetValuePropositionsController;
}

/**
 * Composes exactly the feature the `values list` leaf uses.
 */
async function createValuesListDependencies(): Promise<ValuesListDependencies> {
  return new LeafContainerBuilder().withGetValuePropositionsFeature().build();
}

/** Registers the `values list` leaf under the parent supplied by its group. */
export function registerValuesListCommand(values: Command): void {
  const command = values
    .command("list")
    .description("List all value propositions for the project");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "values list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ValuesListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createValuesListDependencies();
  });

  command.action(async () => {
    if (!dependencies)
      throw new Error("Values list dependencies were not initialized.");
    await valuesList(dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valuesList(container: ValuesListDependencies) {
  const renderer = Renderer.getInstance();

  try {
    const { values } =
      await container.getValuePropositionsController.handle({});

    if (values.length === 0) {
      renderer.info(
        "No value propositions defined yet. Use 'jumbo value add' to add one.",
      );
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();
    const outputBuilder = new ValueListOutputBuilder();

    if (config.format === "text") {
      const output = outputBuilder.build(values);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(values);
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list value propositions",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
