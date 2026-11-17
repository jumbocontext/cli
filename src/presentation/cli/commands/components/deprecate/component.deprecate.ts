/**
 * CLI Command: jumbo component deprecate
 *
 * Marks a component as deprecated when it's being phased out but not yet removed from the codebase.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { DeprecateComponentController } from "../../../../../application/context/components/deprecate/DeprecateComponentController.js";
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
    command: "jumbo component deprecate --id comp_123",
    description: "Deprecate a component without specifying a reason",
  },
  {
    command:
      "jumbo component deprecate --id comp_123 --reason 'Replaced by NewAuthMiddleware'",
    description: "Deprecate a component with a reason",
  },
];

const RELATED_COMMANDS = ["component add", "component update", "component remove"];

/**
 * The abstract ports the `component deprecate` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ComponentDeprecateDependencies {
  readonly deprecateComponentController: DeprecateComponentController;
}

/**
 * Composes exactly the feature the `component deprecate` leaf uses.
 */
async function createComponentDeprecateDependencies(): Promise<ComponentDeprecateDependencies> {
  return new LeafContainerBuilder().withDeprecateComponentFeature().build();
}

/** Registers the `component deprecate` leaf under the parent supplied by its group. */
export function registerComponentDeprecateCommand(component: Command): void {
  const command = component
    .command("deprecate")
    .description("Mark a component as deprecated")
    .requiredOption("-i, --id <id>", "ID of the component to deprecate")
    .option("-r, --reason <reason>", "Reason for deprecation (max 500 chars)");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "component deprecate",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentDeprecateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentDeprecateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error(
        "Component deprecate dependencies were not initialized.",
      );
    await componentDeprecate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentDeprecate(
  options: {
    id: string;
    reason?: string;
  },
  container: ComponentDeprecateDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.deprecateComponentController.handle({
      componentId: options.id,
      reason: options.reason,
    });

    const data: Record<string, string | number> = {
      componentId: response.componentId,
      name: response.name,
      status: response.status,
    };

    if (response.reason) data.reason = response.reason;

    renderer.success(`Component '${response.name}' marked as deprecated`, data);
  } catch (error) {
    renderer.error(
      "Failed to deprecate component",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
