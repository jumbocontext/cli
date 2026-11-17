/**
 * CLI Command: jumbo component remove
 *
 * Marks a component as removed from the system.
 * Component must be deprecated before removal.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveComponentController } from "../../../../../application/context/components/remove/RemoveComponentController.js";
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
    command: "jumbo component remove --id comp_123",
    description: "Remove a deprecated component",
  },
];

const RELATED_COMMANDS = ["component deprecate", "component add", "component update"];

/**
 * The abstract ports the `component remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ComponentRemoveDependencies {
  readonly removeComponentController: RemoveComponentController;
}

/**
 * Composes exactly the feature the `component remove` leaf uses.
 */
async function createComponentRemoveDependencies(): Promise<ComponentRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveComponentFeature().build();
}

/** Registers the `component remove` leaf under the parent supplied by its group. */
export function registerComponentRemoveCommand(component: Command): void {
  const command = component
    .command("remove")
    .description("Mark a component as removed from the system")
    .requiredOption("-i, --id <id>", "ID of the component to remove");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "component remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Component remove dependencies were not initialized.");
    await componentRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentRemove(
  options: {
    id: string;
  },
  container: ComponentRemoveDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeComponentController.handle({
      componentId: options.id,
    });

    const data: Record<string, string> = {
      componentId: response.componentId,
      name: response.name,
      status: response.status,
    };

    renderer.success(`Component '${response.name}' marked as removed`, data);
  } catch (error) {
    renderer.error(
      "Failed to remove component",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
