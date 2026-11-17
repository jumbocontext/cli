/**
 * CLI Command: jumbo dependency update
 *
 * Updates an existing Dependency with new endpoint, contract, or status.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateDependencyController } from "../../../../../application/context/dependencies/update/UpdateDependencyController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { DependencyStatusType } from "../../../../../domain/dependencies/Constants.js";
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
      "jumbo dependency update --id dep_123 --endpoint '/api/v2/users'",
    description: "Update dependency endpoint",
  },
  {
    command: "jumbo dependency update --id dep_123 --status deprecated",
    description: "Mark dependency as deprecated",
  },
  {
    command:
      "jumbo dependency update --id dep_123 --contract 'REST API' --status active",
    description: "Update multiple fields",
  },
  {
    command:
      "jumbo relation add --from-type component --from-id UserController --to-type component --to-id AuthMiddleware --type depends_on --description 'UserController depends on AuthMiddleware'",
    description: "Component coupling belongs in relations",
  },
];

const RELATED_COMMANDS = ["dependency add", "dependency remove", "relation add"];

/**
 * The abstract ports the `dependency update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface DependencyUpdateDependencies {
  readonly updateDependencyController: UpdateDependencyController;
}

/**
 * Composes exactly the feature the `dependency update` leaf uses.
 */
async function createDependencyUpdateDependencies(): Promise<DependencyUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateDependencyFeature().build();
}

/** Registers the `dependency update` leaf under the parent supplied by its group. */
export function registerDependencyUpdateCommand(dependency: Command): void {
  const command = dependency
    .command("update")
    .description(
      "Update a third-party dependency with new endpoint, contract, or status",
    )
    .requiredOption("-i, --id <id>", "ID of the dependency to update")
    .option("--endpoint <endpoint>", "Updated API endpoint or connection string")
    .option("--contract <contract>", "Updated contract or interface definition")
    .option("-s, --status <status>", "Updated status (active, deprecated, removed)");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "dependency update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DependencyUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDependencyUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Dependency update dependencies were not initialized.");
    await dependencyUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependencyUpdate(
  options: {
    id: string;
    endpoint?: string;
    contract?: string;
    status?: DependencyStatusType;
  },
  container: DependencyUpdateDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateDependencyController.handle({
      dependencyId: options.id,
      endpoint: options.endpoint,
      contract: options.contract,
      status: options.status,
    });

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: response.dependencyId,
    };
    if (response.name) data.name = response.name;
    if (response.ecosystem) data.ecosystem = response.ecosystem;
    if (response.packageName) data.packageName = response.packageName;
    if (response.versionConstraint)
      data.versionConstraint = response.versionConstraint;
    if (response.endpoint) data.endpoint = response.endpoint;
    if (response.contract) data.contract = response.contract;
    if (response.status) data.status = response.status;

    renderer.success(`Dependency updated`, data);
  } catch (error) {
    renderer.error(
      "Failed to update dependency",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
