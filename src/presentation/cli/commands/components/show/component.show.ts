/**
 * CLI Command: jumbo component show
 *
 * Displays a component's full details and all relations where the
 * component is either source or target.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ShowComponentController } from "../../../../../application/context/components/show/ShowComponentController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ComponentShowOutputBuilder } from "./ComponentShowOutputBuilder.js";
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
    command: 'jumbo component show --name "AddComponentCommandHandler"',
    description: "Show component by name",
  },
  {
    command: "jumbo component show --id comp_abc123",
    description: "Show component by ID",
  },
];

const RELATED_COMMANDS = ["component add", "component update", "components list"];

/**
 * The abstract ports the `component show` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ComponentShowDependencies {
  readonly showComponentController: ShowComponentController;
}

/**
 * Composes exactly the feature the `component show` leaf uses.
 */
async function createComponentShowDependencies(): Promise<ComponentShowDependencies> {
  return new LeafContainerBuilder().withShowComponentFeature().build();
}

/** Registers the `component show` leaf under the parent supplied by its group. */
export function registerComponentShowCommand(component: Command): void {
  const command = component
    .command("show")
    .description("Display component details and relations")
    .option(
      "-i, --id <componentId>",
      "ID of the component to show (either --id or --name required)",
    )
    .option(
      "-n, --name <name>",
      "Name of the component to show (either --id or --name required)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "component show",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentShowDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentShowDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Component show dependencies were not initialized.");
    await componentShow(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentShow(
  options: { id?: string; name?: string },
  container: ComponentShowDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate that at least one identifier is provided
    if (!options.id && !options.name) {
      renderer.error("Either --id or --name is required");
      process.exit(1);
    }

    const result = await container.showComponentController.handle({
      componentId: options.id,
      name: options.name,
    });

    // Build and render output using builder pattern
    const outputBuilder = new ComponentShowOutputBuilder();
    if (process.stdout.isTTY) {
      const output = outputBuilder.build(result.component, result.relations);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        result.component,
        result.relations,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) {
        renderer.data(dataSection.content as Record<string, unknown>);
      }
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Component not found")
    ) {
      const identifier = options.id || options.name || "unknown";
      renderer.error(
        "Component not found",
        `No component exists with ID or name: ${identifier}`,
      );
      process.exit(1);
    }

    renderer.error(
      "Failed to show component",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
