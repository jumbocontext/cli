/**
 * CLI Command: jumbo search
 *
 * Searches the global Jumbo memory index across all categories.
 */

import type { Command } from "commander";
import type { CommandExample } from "../registry/CommandMetadata.js";
import { LeafContainerBuilder } from "../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../rendering/Renderer.js";
import { RenderData } from "../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { SearchCategory } from "../../../../application/context/search/SearchCategory.js";
import { SearchRequest } from "../../../../application/context/search/SearchRequest.js";
import { SearchResultLimit } from "../../../../application/context/search/SearchResultLimit.js";
import { SearchController } from "../../../../application/context/search/SearchController.js";
import {
  SearchOutputBuilder,
  SearchOutputFormat,
} from "./SearchOutputBuilder.js";

/**
 * Valid search categories, accepted as a comma-separated list via --category.
 */
const VALID_SEARCH_CATEGORIES: readonly string[] = Object.values(SearchCategory);

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: 'jumbo search --query "event bus"',
    description: "Search all memory categories",
  },
  {
    command:
      'jumbo search --query "sqlite" --category decision --output compact',
    description: "Search one category with compact output",
  },
  {
    command: 'jumbo search --query "testing" --limit 10 --format json',
    description: "Emit structured search results for agents",
  },
];

/**
 * The abstract ports the `search` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface SearchDependencies {
  readonly searchController: SearchController;
}

/**
 * Composes exactly the feature the `search` leaf uses.
 */
async function createSearchDependencies(): Promise<SearchDependencies> {
  return new LeafContainerBuilder().withSearchFeature().build();
}

/** Registers the standalone `search` leaf directly on the root program. */
export function registerSearchCommand(program: Command): void {
  const command = program
    .command("search")
    .description("Search the global Jumbo memory index")
    .requiredOption("-q, --query <query>", "Search query text")
    .option(
      "-c, --category <category>",
      "Filter by category: component, dependency, decision, guideline, invariant",
    )
    .option(
      "-l, --limit <limit>",
      `Maximum results to return (${SearchResultLimit.MIN}-${SearchResultLimit.MAX})`,
    )
    .option(
      "-o, --output <output>",
      "Output detail level: default or compact",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "search",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.projectKnowledge,
        examples: EXAMPLES,
        related: [
          "components search",
          "decisions search",
          "dependencies search",
          "guidelines search",
          "invariants search",
        ],
      }),
    });

  let dependencies: SearchDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createSearchDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Search dependencies were not initialized.");
    }
    await searchMemory(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function searchMemory(
  options: {
    query: string;
    category?: string;
    limit?: string;
    output?: string;
  },
  container: SearchDependencies,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const query = normalizeQuery(options.query, renderer);
  const category = normalizeCategory(options.category, renderer);
  const limit = normalizeLimit(options.limit, renderer);
  const outputFormat = normalizeOutputFormat(options.output, renderer);

  const request: SearchRequest = {
    criteria: {
      query,
      groupByCategory: true,
      ...(category ? { category } : {}),
      ...(limit ? { limit } : {}),
    },
  };

  try {
    const response = await container.searchController.handle(request);
    const outputBuilder = new SearchOutputBuilder();

    if (renderer.getConfig().format === "text") {
      const output = outputBuilder.build(
        response,
        { query, category, limit },
        outputFormat,
      );
      renderer.info(output.toHumanReadable());
      return;
    }

    const output = outputBuilder.buildStructuredOutput(
      response,
      { query, category, limit },
      outputFormat,
    );
    const data = output.getSections().find((section) => section.type === "data")
      ?.content as RenderData;
    renderer.data(data);
  } catch (error) {
    renderer.error(
      "Failed to search Jumbo memory",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}

function normalizeQuery(query: string | undefined, renderer: Renderer): string {
  const normalized = query?.trim();
  if (!normalized) {
    renderer.error("Search query cannot be empty");
    process.exit(1);
  }

  return normalized;
}

function normalizeCategory(
  category: string | undefined,
  renderer: Renderer,
): SearchCategory | undefined {
  if (!category) {
    return undefined;
  }

  if (!VALID_SEARCH_CATEGORIES.includes(category)) {
    renderer.error(
      `Invalid category: ${category}. Must be one of: ${VALID_SEARCH_CATEGORIES.join(", ")}`,
    );
    process.exit(1);
  }

  return category as SearchCategory;
}

function normalizeLimit(
  limit: string | undefined,
  renderer: Renderer,
): number | undefined {
  if (!limit) {
    return undefined;
  }

  const parsed = Number.parseInt(limit, 10);
  if (
    !Number.isInteger(parsed) ||
    String(parsed) !== limit ||
    parsed < SearchResultLimit.MIN ||
    parsed > SearchResultLimit.MAX
  ) {
    renderer.error(
      `Invalid limit: ${limit}. Must be an integer from ${SearchResultLimit.MIN} to ${SearchResultLimit.MAX}`,
    );
    process.exit(1);
  }

  return parsed;
}

function normalizeOutputFormat(
  output: string | undefined,
  renderer: Renderer,
): SearchOutputFormat {
  if (!output || output === "default") {
    return "default";
  }

  if (output === "compact") {
    return "compact";
  }

  renderer.error(
    `Invalid output format: ${output}. Must be one of: default, compact`,
  );
  process.exit(1);
}
