/**
 * CLI Command: jumbo dependencies search
 *
 * Searches dependencies by identity fields, status, legacy links, and free text.
 * Filters combine with AND logic.
 */

import type { Command } from "commander";
import type { SearchDependenciesController } from "../../../../../application/context/dependencies/search/SearchDependenciesController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { DependencySearchCriteria } from "../../../../../application/context/dependencies/search/DependencySearchCriteria.js";
import { SearchDependenciesRequest } from "../../../../../application/context/dependencies/search/SearchDependenciesRequest.js";
import {
  DependencyStatus,
  DependencyStatusType,
} from "../../../../../domain/dependencies/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import {
  DependencySearchOutputBuilder,
  DependencySearchOutputFormat,
} from "./DependencySearchOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

const VALID_DEPENDENCY_STATUSES = Object.values(DependencyStatus);

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo dependencies search --ecosystem npm --query express",
    description: "Search npm dependencies using free text",
  },
  {
    command:
      'jumbo dependencies search --package-name "@types/*" --output compact',
    description: "Search dependencies with wildcard package matching",
  },
];

const RELATED_COMMANDS = ["dependencies list", "dependency add", "dependency update"];

/**
 * The abstract ports the `dependencies search` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DependenciesSearchDependencies {
  readonly searchDependenciesController: SearchDependenciesController;
}

/**
 * Composes exactly the feature the `dependencies search` leaf uses.
 */
async function createDependenciesSearchDependencies(): Promise<DependenciesSearchDependencies> {
  return new LeafContainerBuilder().withSearchDependenciesFeature().build();
}

/** Registers the `dependencies search` leaf under the parent supplied by its group. */
export function registerDependenciesSearchCommand(
  dependencies: Command,
): void {
  const command = dependencies
    .command("search")
    .description(
      "Search dependencies by identity, status, links, or free-text query",
    )
    .option(
      "--name <name>",
      "Filter by dependency display name (substring match, or use * for wildcards)",
    )
    .option(
      "--ecosystem <ecosystem>",
      "Filter by ecosystem (substring match, or use * for wildcards)",
    )
    .option(
      "--package-name <packageName>",
      "Filter by package name (substring match, or use * for wildcards)",
    )
    .option(
      "--version <version>",
      "Filter by version constraint (substring match, or use * for wildcards)",
    )
    .option(
      "--status <status>",
      "Filter by status (exact match): active, deprecated, removed",
    )
    .option(
      "--consumer <componentId>",
      "Legacy filter by former consumer component ID (substring match, or use * for wildcards)",
    )
    .option(
      "--provider <componentId>",
      "Legacy filter by former provider component ID (substring match, or use * for wildcards)",
    )
    .option(
      "-q, --query <query>",
      "Free-text search across name, ecosystem, package, version, contract, and endpoint",
    )
    .option("-o, --output <output>", "Output detail level: default or compact");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "dependencies search",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies2: DependenciesSearchDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies2 = await createDependenciesSearchDependencies();
  });

  command.action(async (options) => {
    if (!dependencies2)
      throw new Error(
        "Dependencies search dependencies were not initialized.",
      );
    await dependenciesSearch(options, dependencies2);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependenciesSearch(
  options: {
    name?: string;
    ecosystem?: string;
    packageName?: string;
    version?: string;
    status?: string;
    consumer?: string;
    provider?: string;
    query?: string;
    output?: string;
  },
  container: DependenciesSearchDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    if (
      options.status &&
      !VALID_DEPENDENCY_STATUSES.includes(
        options.status as DependencyStatusType,
      )
    ) {
      renderer.error(
        `Invalid status: ${options.status}. Must be one of: ${VALID_DEPENDENCY_STATUSES.join(", ")}`,
      );
      process.exit(1);
    }

    const outputFormat: DependencySearchOutputFormat =
      options.output === "compact" ? "compact" : "default";
    if (
      options.output &&
      options.output !== "default" &&
      options.output !== "compact"
    ) {
      renderer.error(
        `Invalid output format: ${options.output}. Must be one of: default, compact`,
      );
      process.exit(1);
    }

    const criteria: DependencySearchCriteria = {
      ...(options.name && { name: options.name }),
      ...(options.ecosystem && { ecosystem: options.ecosystem }),
      ...(options.packageName && { packageName: options.packageName }),
      ...(options.version && { versionConstraint: options.version }),
      ...(options.status && { status: options.status as DependencyStatusType }),
      ...(options.consumer && { consumer: options.consumer }),
      ...(options.provider && { provider: options.provider }),
      ...(options.query && { query: options.query }),
    };

    const request: SearchDependenciesRequest = { criteria };
    const { dependencies } =
      await container.searchDependenciesController.handle(request);

    const outputBuilder = new DependencySearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(dependencies, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        dependencies,
        outputFormat,
      );
      const dataSection = output.getSections().find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to search dependencies",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
