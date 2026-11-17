/**
 * CLI Command: jumbo dependency remove
 *
 * Removes a dependency from the project (transitions status to 'removed').
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveDependencyController } from "../../../../../application/context/dependencies/remove/RemoveDependencyController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { RemoveDependencyRequest } from "../../../../../application/context/dependencies/remove/RemoveDependencyRequest.js";
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
    command: "jumbo dependency remove --id dep_abc123",
    description: "Remove a third-party dependency from the project",
  },
  {
    command:
      "jumbo dependency remove --id dep_abc123 --reason 'Migrated to MongoDB'",
    description: "Remove a dependency with a reason",
  },
  {
    command: "jumbo relation remove --id relation_abc123",
    description:
      "Component coupling records are managed with relation commands",
  },
];

const RELATED_COMMANDS = ["dependency add", "dependency update", "relation remove"];

/**
 * The abstract ports the `dependency remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface DependencyRemoveDependencies {
  readonly removeDependencyController: RemoveDependencyController;
}

/**
 * Composes exactly the feature the `dependency remove` leaf uses.
 */
async function createDependencyRemoveDependencies(): Promise<DependencyRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveDependencyFeature().build();
}

/** Registers the `dependency remove` leaf under the parent supplied by its group. */
export function registerDependencyRemoveCommand(dependency: Command): void {
  const command = dependency
    .command("remove")
    .description("Remove a third-party dependency from the project")
    .requiredOption("-i, --id <id>", "ID of the dependency to remove")
    .option("-r, --reason <reason>", "Reason for removing the dependency");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "dependency remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DependencyRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDependencyRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Dependency remove dependencies were not initialized.");
    await dependencyRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependencyRemove(
  options: {
    id: string;
    reason?: string;
  },
  container: DependencyRemoveDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const request: RemoveDependencyRequest = {
      dependencyId: options.id,
      reason: options.reason,
    };

    const response = await container.removeDependencyController.handle(request);

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: response.dependencyId,
      name: response.name,
      ecosystem: response.ecosystem,
      packageName: response.packageName,
      status: response.status,
    };
    if (response.reason) data.reason = response.reason;

    renderer.success(
      `Dependency '${response.ecosystem}:${response.packageName} (${response.name})' removed`,
      data,
    );
  } catch (error) {
    renderer.error(
      "Failed to remove dependency",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
