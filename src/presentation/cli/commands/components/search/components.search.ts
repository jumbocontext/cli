/**
 * CLI Command: jumbo components search
 *
 * Searches components by name, type, status, and free-text query
 * across description and responsibility fields.
 * Filters combine with AND logic.
 *
 * Usage:
 *   jumbo components search --name auth
 *   jumbo components search --type service --status active
 *   jumbo components search --query "event bus" --output compact
 *   jumbo components search --name api --format json
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { SearchComponentsController } from "../../../../../application/context/components/search/SearchComponentsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { ComponentSearchCriteria } from "../../../../../application/context/components/search/ComponentSearchCriteria.js";
import { SearchComponentsRequest } from "../../../../../application/context/components/search/SearchComponentsRequest.js";
import { ComponentTypeValue } from "../../../../../domain/components/Constants.js";
import { ComponentStatusValue } from "../../../../../domain/components/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  ComponentSearchOutputBuilder,
  SearchOutputFormat,
} from "./ComponentSearchOutputBuilder.js";
import {
  VALID_COMPONENT_TYPES,
  VALID_COMPONENT_STATUSES,
} from "../../../../../domain/components/Constants.js";
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
    command: "jumbo components search --name auth",
    description: "Search components by name",
  },
  {
    command: "jumbo components search --type service",
    description: "Search for all service components",
  },
  {
    command:
      'jumbo components search --query "event handling" --output compact',
    description: "Free-text search with compact output",
  },
];

const RELATED_COMMANDS = ["components list", "component add", "component show"];

/**
 * The abstract ports the `components search` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface ComponentsSearchDependencies {
  readonly searchComponentsController: SearchComponentsController;
}

/**
 * Composes exactly the feature the `components search` leaf uses.
 */
async function createComponentsSearchDependencies(): Promise<ComponentsSearchDependencies> {
  return new LeafContainerBuilder().withSearchComponentsFeature().build();
}

/** Registers the `components search` leaf under the parent supplied by its group. */
export function registerComponentsSearchCommand(components: Command): void {
  const command = components
    .command("search")
    .description("Search components by name, type, status, or free-text query")
    .option(
      "-n, --name <name>",
      "Filter by name (substring match, or use * for wildcards: Auth*, *Service)",
    )
    .option(
      "-t, --type <type>",
      "Filter by type (exact match): service, db, queue, ui, lib, api, worker, cache, storage",
    )
    .option(
      "-s, --status <status>",
      "Filter by status (exact match): active, deprecated, removed. Defaults to excluding deprecated",
    )
    .option(
      "-q, --query <query>",
      "Free-text search across description and responsibility fields (supports * wildcards)",
    )
    .option(
      "-o, --output <output>",
      "Output detail level: default or compact (id, name, type only)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "components search",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: ComponentsSearchDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createComponentsSearchDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error(
        "Components search dependencies were not initialized.",
      );
    await componentsSearch(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentsSearch(
  options: {
    name?: string;
    type?: string;
    status?: string;
    query?: string;
    output?: string;
  },
  container: ComponentsSearchDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate type filter
    if (options.type && !VALID_COMPONENT_TYPES.includes(options.type)) {
      renderer.error(
        `Invalid type: ${options.type}. Must be one of: ${VALID_COMPONENT_TYPES.join(", ")}`,
      );
      process.exit(1);
    }

    // Validate status filter
    if (options.status && !VALID_COMPONENT_STATUSES.includes(options.status)) {
      renderer.error(
        `Invalid status: ${options.status}. Must be one of: ${VALID_COMPONENT_STATUSES.join(", ")}`,
      );
      process.exit(1);
    }

    // Validate output format
    const outputFormat: SearchOutputFormat =
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

    // Build search criteria
    const criteria: ComponentSearchCriteria = {
      ...(options.name && { name: options.name }),
      ...(options.type && { type: options.type as ComponentTypeValue }),
      ...(options.status && { status: options.status as ComponentStatusValue }),
      ...(options.query && { query: options.query }),
    };

    // Execute search via controller
    const request: SearchComponentsRequest = { criteria };
    const { components } =
      await container.searchComponentsController.handle(request);

    // Render output
    const outputBuilder = new ComponentSearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(components, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        components,
        outputFormat,
      );
      renderer.data(
        JSON.parse(
          JSON.stringify(
            output.getSections().find((s) => s.type === "data")?.content,
          ),
        ),
      );
    }
  } catch (error) {
    renderer.error(
      "Failed to search components",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
