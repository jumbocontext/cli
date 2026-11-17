/**
 * CLI Command: jumbo invariants search
 *
 * Searches invariants by title and free-text query across title,
 * description, and rationale fields. Filters combine with AND logic.
 *
 * Usage:
 *   jumbo invariants search --title architecture
 *   jumbo invariants search --query "stdout" --output compact
 *   jumbo invariants search --title Clean* --format json
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { SearchInvariantsController } from "../../../../../application/context/invariants/search/SearchInvariantsController.js";
import { InvariantSearchCriteria } from "../../../../../application/context/invariants/search/InvariantSearchCriteria.js";
import { SearchInvariantsRequest } from "../../../../../application/context/invariants/search/SearchInvariantsRequest.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  InvariantSearchOutputBuilder,
  InvariantSearchOutputFormat,
} from "./InvariantSearchOutputBuilder.js";
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
    command: "jumbo invariants search --title architecture",
    description: "Search invariants by title",
  },
  {
    command: 'jumbo invariants search --query "stdout" --output compact',
    description: "Free-text search with compact output",
  },
];

const RELATED_COMMANDS = [
  "invariants list",
  "invariant add",
  "invariant update",
  "invariant remove",
];

/**
 * The abstract ports the `invariants search` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface InvariantsSearchDependencies {
  readonly searchInvariantsController: SearchInvariantsController;
}

/**
 * Composes exactly the features the `invariants search` leaf uses.
 */
async function createInvariantsSearchDependencies(): Promise<InvariantsSearchDependencies> {
  return new LeafContainerBuilder().withSearchInvariantsFeature().build();
}

/** Registers the `invariants search` leaf under the parent supplied by its group. */
export function registerInvariantsSearchCommand(invariants: Command): void {
  const command = invariants
    .command("search")
    .description("Search invariants by title or free-text query")
    .option(
      "-t, --title <title>",
      "Filter by title (substring match, or use * for wildcards: Clean*, *Architecture)",
    )
    .option(
      "-q, --query <query>",
      "Free-text search across title, description, and rationale fields (supports * wildcards)",
    )
    .option(
      "-o, --output <output>",
      "Output detail level: default or compact (id and title only)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "invariants search",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: InvariantsSearchDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createInvariantsSearchDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Invariants search dependencies were not initialized.");
    }
    await invariantsSearch(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function invariantsSearch(
  options: { title?: string; query?: string; output?: string },
  container: InvariantsSearchDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const outputFormat: InvariantSearchOutputFormat =
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

    const criteria: InvariantSearchCriteria = {
      ...(options.title && { title: options.title }),
      ...(options.query && { query: options.query }),
    };

    const request: SearchInvariantsRequest = { criteria };
    const { invariants } =
      await container.searchInvariantsController.handle(request);

    const outputBuilder = new InvariantSearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(invariants, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        invariants,
        outputFormat,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to search invariants",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
