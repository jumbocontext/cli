/**
 * CLI Command: jumbo component update
 *
 * Updates an existing component's metadata.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateComponentController } from "../../../../../application/context/components/update/UpdateComponentController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { ComponentTypeValue } from "../../../../../domain/components/Constants.js";
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
      'jumbo component update --id comp_123 --description "Updated: Handles all user operations"',
    description: "Update component description",
  },
  {
    command:
      'jumbo component update --id comp_123 --description "New description" --responsibility "New responsibility" --type api',
    description: "Update multiple fields",
  },
];

const RELATED_COMMANDS = ["component add", "component deprecate", "component remove"];

/**
 * The abstract ports the `component update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ComponentUpdateDependencies {
  readonly updateComponentController: UpdateComponentController;
}

/**
 * Composes exactly the feature the `component update` leaf uses.
 */
async function createComponentUpdateDependencies(): Promise<ComponentUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateComponentFeature().build();
}

/** Registers the `component update` leaf under the parent supplied by its group. */
export function registerComponentUpdateCommand(component: Command): void {
  const command = component
    .command("update")
    .description("Update an existing component's metadata")
    .requiredOption("-i, --id <id>", "ID of the component to update")
    .option(
      "-d, --description <text>",
      "Updated description (at least one field required)",
    )
    .option(
      "--responsibility <text>",
      "Updated responsibility (at least one field required)",
    )
    .option("--path <path>", "Updated file path (at least one field required)")
    .option(
      "-T, --type <type>",
      "Updated component type (api, service, db, queue, ui, lib, worker, cache, storage) (at least one field required)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "component update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Component update dependencies were not initialized.");
    await componentUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentUpdate(
  options: {
    id: string;
    description?: string;
    responsibility?: string;
    path?: string;
    type?: ComponentTypeValue;
  },
  container: ComponentUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  // Validate at least one field provided
  if (
    !options.description &&
    !options.responsibility &&
    !options.path &&
    !options.type
  ) {
    renderer.error(
      "At least one field must be provided to update (--description, --responsibility, --path, or --type)",
    );
    process.exit(1);
  }

  try {
    const response = await container.updateComponentController.handle({
      componentId: options.id,
      description: options.description,
      responsibility: options.responsibility,
      path: options.path,
      type: options.type,
    });

    // Success output
    const data: Record<string, string | number> = {
      componentId: response.componentId,
      name: response.view?.name || options.id,
    };

    if (options.description) data.description = options.description;
    if (options.responsibility) data.responsibility = options.responsibility;
    if (options.path) data.path = options.path;
    if (options.type) data.type = options.type;

    renderer.success(
      `Component '${response.view?.name || options.id}' updated`,
      data,
    );
  } catch (error) {
    renderer.error(
      "Failed to update component",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
