/**
 * CLI Command: jumbo dependencies list
 *
 * Lists all registered dependencies with optional filtering.
 *
 * Usage:
 *   jumbo dependencies list
 *   jumbo dependencies list --ecosystem npm
 *   jumbo dependencies list --package-name express --format json
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetDependenciesController } from "../../../../../application/context/dependencies/get/GetDependenciesController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { DependencyListOutputBuilder } from "./DependencyListOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo dependencies list",
    description: "List all dependencies",
  },
  {
    command: "jumbo dependencies list --ecosystem npm",
    description: "List external dependencies from npm",
  },
  {
    command:
      "jumbo dependencies list --consumer comp_123 --provider comp_456 --format json",
    description:
      "Legacy compatibility filter for historical coupling records (deprecated, removed in v3.0.0)",
  },
];

const RELATED_COMMANDS = [
  "dependency add",
  "dependency update",
  "dependency remove",
  "relation list",
];

/**
 * The abstract ports the `dependencies list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DependenciesListDependencies {
  readonly getDependenciesController: GetDependenciesController;
}

/**
 * Composes exactly the feature the `dependencies list` leaf uses.
 */
async function createDependenciesListDependencies(): Promise<DependenciesListDependencies> {
  return new LeafContainerBuilder().withGetDependenciesFeature().build();
}

/** Registers the `dependencies list` leaf under the parent supplied by its group. */
export function registerDependenciesListCommand(dependencies: Command): void {
  const command = dependencies
    .command("list")
    .description("List third-party dependencies (packages/services)")
    .option("--name <name>", "Filter by dependency display name")
    .option("--ecosystem <ecosystem>", "Filter by ecosystem")
    .option("--package-name <packageName>", "Filter by package name")
    .option(
      "--consumer <componentId>",
      "Legacy filter (deprecated, removed in v3.0.0): former consumer component ID",
    )
    .option(
      "--provider <componentId>",
      "Legacy filter (deprecated, removed in v3.0.0): former provider component ID",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "dependencies list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies2: DependenciesListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies2 = await createDependenciesListDependencies();
  });

  command.action(async (options) => {
    if (!dependencies2)
      throw new Error("Dependencies list dependencies were not initialized.");
    await dependenciesList(options, dependencies2);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependenciesList(
  options: {
    name?: string;
    ecosystem?: string;
    packageName?: string;
    consumer?: string;
    provider?: string;
  },
  container: DependenciesListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    // Build filter from options
    const filter = {
      name: options.name,
      ecosystem: options.ecosystem,
      packageName: options.packageName,
      consumer: options.consumer,
      provider: options.provider,
    };

    // Delegate to controller
    const { dependencies } = await container.getDependenciesController.handle({
      filter,
    });

    if (dependencies.length === 0) {
      const filterParts: string[] = [];
      if (filter.name) filterParts.push(`name '${filter.name}'`);
      if (filter.ecosystem) filterParts.push(`ecosystem '${filter.ecosystem}'`);
      if (filter.packageName)
        filterParts.push(`package '${filter.packageName}'`);
      if (filter.consumer) filterParts.push(`consumer '${filter.consumer}'`);
      if (filter.provider) filterParts.push(`provider '${filter.provider}'`);
      const filterMsg =
        filterParts.length > 0 ? ` for ${filterParts.join(" and ")}` : "";
      renderer.info(
        `No dependencies found${filterMsg}. Use 'jumbo dependency add' to add one.`,
      );
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();

    const filterParts: string[] = [];
    if (filter.name) filterParts.push(`name: ${filter.name}`);
    if (filter.ecosystem) filterParts.push(`ecosystem: ${filter.ecosystem}`);
    if (filter.packageName)
      filterParts.push(`packageName: ${filter.packageName}`);
    if (filter.consumer) filterParts.push(`consumer: ${filter.consumer}`);
    if (filter.provider) filterParts.push(`provider: ${filter.provider}`);
    const filterLabel = filterParts.length > 0 ? filterParts.join(", ") : "all";

    const outputBuilder = new DependencyListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(dependencies, filterLabel);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        dependencies,
        filterLabel,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list dependencies",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
