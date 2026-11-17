/**
 * CLI Command: jumbo component rename
 *
 * Renames an existing component while preserving its identity and relations.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RenameComponentController } from "../../../../../application/context/components/rename/RenameComponentController.js";
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
    command: 'jumbo component rename --id comp_123 --name "NewComponentName"',
    description: "Rename a component",
  },
];

const RELATED_COMMANDS = [
  "component add",
  "component update",
  "component deprecate",
  "component remove",
];

/**
 * The abstract ports the `component rename` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ComponentRenameDependencies {
  readonly renameComponentController: RenameComponentController;
}

/**
 * Composes exactly the feature the `component rename` leaf uses.
 */
async function createComponentRenameDependencies(): Promise<ComponentRenameDependencies> {
  return new LeafContainerBuilder().withRenameComponentFeature().build();
}

/** Registers the `component rename` leaf under the parent supplied by its group. */
export function registerComponentRenameCommand(component: Command): void {
  const command = component
    .command("rename")
    .description("Rename an existing component")
    .requiredOption("-i, --id <id>", "ID of the component to rename")
    .requiredOption("-n, --name <name>", "New name for the component");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "component rename",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentRenameDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentRenameDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Component rename dependencies were not initialized.");
    await componentRename(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentRename(
  options: {
    id: string;
    name: string;
  },
  container: ComponentRenameDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.renameComponentController.handle({
      componentId: options.id,
      name: options.name,
    });

    renderer.success(`Component renamed to '${options.name}'`, {
      componentId: response.componentId,
      name: options.name,
    });
  } catch (error) {
    renderer.error(
      "Failed to rename component",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
