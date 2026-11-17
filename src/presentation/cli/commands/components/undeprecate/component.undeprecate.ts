/**
 * CLI Command: jumbo component undeprecate
 *
 * Restores a deprecated component to active status.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UndeprecateComponentController } from "../../../../../application/context/components/undeprecate/UndeprecateComponentController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ComponentUndeprecateOutputBuilder } from "./ComponentUndeprecateOutputBuilder.js";
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
      'jumbo component undeprecate --id comp_123 --reason "Still required by active features"',
    description: "Undeprecate a previously deprecated component",
  },
];

const RELATED_COMMANDS = ["component deprecate", "component remove", "component update"];

/**
 * The abstract ports the `component undeprecate` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface ComponentUndeprecateDependencies {
  readonly undeprecateComponentController: UndeprecateComponentController;
}

/**
 * Composes exactly the feature the `component undeprecate` leaf uses.
 */
async function createComponentUndeprecateDependencies(): Promise<ComponentUndeprecateDependencies> {
  return new LeafContainerBuilder().withUndeprecateComponentFeature().build();
}

/** Registers the `component undeprecate` leaf under the parent supplied by its group. */
export function registerComponentUndeprecateCommand(component: Command): void {
  const command = component
    .command("undeprecate")
    .description("Restore a deprecated component to active status")
    .requiredOption("-i, --id <id>", "ID of the component to undeprecate")
    .requiredOption("-r, --reason <reason>", "Reason for undeprecating the component");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "component undeprecate",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentUndeprecateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentUndeprecateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error(
        "Component undeprecate dependencies were not initialized.",
      );
    await componentUndeprecate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentUndeprecate(
  options: {
    id: string;
    reason: string;
  },
  container: ComponentUndeprecateDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new ComponentUndeprecateOutputBuilder();

  try {
    const response = await container.undeprecateComponentController.handle({
      componentId: options.id,
      reason: options.reason,
    });

    const output = outputBuilder.buildSuccess(
      response.componentId,
      response.name,
      response.reason,
    );
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
