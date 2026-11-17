/**
 * CLI Command: jumbo component add
 *
 * Adds a new component to the system or updates existing component if name already exists.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { AddComponentController } from "../../../../../application/context/components/add/AddComponentController.js";
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
      'jumbo component add --name "UserController" --type "service" --description "Handles user-related HTTP requests" --responsibility "User authentication and profile management" --path "src/api/user-controller.ts"',
    description: "Add a service component",
  },
  {
    command:
      'jumbo component add --name "PostgresDB" --type "db" --description "Primary database" --responsibility "Data persistence" --path "docker-compose.yml"',
    description: "Add a database component",
  },
];

const RELATED_COMMANDS = ["component update", "component deprecate", "component remove"];

/**
 * The abstract ports the `component add` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ComponentAddDependencies {
  readonly addComponentController: AddComponentController;
}

/**
 * Composes exactly the feature the `component add` leaf uses.
 */
async function createComponentAddDependencies(): Promise<ComponentAddDependencies> {
  return new LeafContainerBuilder().withAddComponentFeature().build();
}

/** Registers the `component add` leaf under the parent supplied by its group. */
export function registerComponentAddCommand(component: Command): void {
  const command = component
    .command("add")
    .description("Add a component to track software components in the system")
    .requiredOption("-n, --name <name>", "Component name")
    .requiredOption(
      "-T, --type <type>",
      "Component type (service, db, queue, ui, lib, api, worker, cache, storage)",
    )
    .requiredOption("-d, --description <description>", "What the component does")
    .requiredOption("--responsibility <responsibility>", "Single responsibility of the component")
    .requiredOption("--path <path>", "File path to the component");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "component add",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentAddDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentAddDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Component add dependencies were not initialized.");
    await componentAdd(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentAdd(
  options: {
    name: string;
    type: ComponentTypeValue;
    description: string;
    responsibility: string;
    path: string;
  },
  container: ComponentAddDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.addComponentController.handle({
      name: options.name,
      type: options.type,
      description: options.description,
      responsibility: options.responsibility,
      path: options.path,
    });

    const data: Record<string, string> = {
      componentId: response.componentId,
      name: response.name,
      type: response.type,
      path: response.path,
      status: response.status,
    };

    if (response.isUpdate) {
      renderer.success(`Component '${response.name}' updated`, data);
    } else {
      renderer.success(`Component '${response.name}' added`, data);
    }
  } catch (error) {
    renderer.error(
      "Failed to add component",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
