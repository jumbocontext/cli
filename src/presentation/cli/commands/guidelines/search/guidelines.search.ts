/**
 * CLI Command: jumbo guidelines search
 *
 * Searches guidelines by category, title, and free-text query across title,
 * description, rationale, and examples fields. Filters combine with AND logic.
 *
 * Usage:
 *   jumbo guidelines search --category testing
 *   jumbo guidelines search --title "Output*"
 *   jumbo guidelines search --query "stdout" --output compact
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { SearchGuidelinesController } from "../../../../../application/context/guidelines/search/SearchGuidelinesController.js";
import { GuidelineSearchCriteria } from "../../../../../application/context/guidelines/search/GuidelineSearchCriteria.js";
import { SearchGuidelinesRequest } from "../../../../../application/context/guidelines/search/SearchGuidelinesRequest.js";
import {
  GuidelineCategoryValue,
  GuidelineCategory,
} from "../../../../../domain/guidelines/Constants.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  GuidelineSearchOutputBuilder,
  GuidelineSearchOutputFormat,
} from "./GuidelineSearchOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

const VALID_GUIDELINE_CATEGORIES = Object.values(GuidelineCategory);

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo guidelines search --category testing",
    description: "Search guidelines by category",
  },
  {
    command: 'jumbo guidelines search --title "Output*"',
    description: "Search guidelines by title",
  },
  {
    command: 'jumbo guidelines search --query "stdout" --output compact',
    description: "Free-text search with compact output",
  },
];

const RELATED_COMMANDS = [
  "guidelines list",
  "guideline add",
  "guideline update",
  "guideline remove",
];

/**
 * The abstract ports the `guidelines search` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GuidelinesSearchDependencies {
  readonly searchGuidelinesController: SearchGuidelinesController;
}

/**
 * Composes exactly the features the `guidelines search` leaf uses.
 */
async function createGuidelinesSearchDependencies(): Promise<GuidelinesSearchDependencies> {
  return new LeafContainerBuilder().withSearchGuidelinesFeature().build();
}

/** Registers the `guidelines search` leaf under the parent supplied by its group. */
export function registerGuidelinesSearchCommand(guidelines: Command): void {
  const command = guidelines
    .command("search")
    .description("Search guidelines by category, title, or free-text query")
    .option(
      "-c, --category <category>",
      "Filter by category (exact match): testing, codingStyle, process, communication, documentation, security, performance, other",
    )
    .option(
      "-t, --title <title>",
      "Filter by title (substring match, or use * for wildcards: Output*, *Style)",
    )
    .option(
      "-q, --query <query>",
      "Free-text search across title, description, rationale, and examples fields (supports * wildcards)",
    )
    .option(
      "-o, --output <output>",
      "Output detail level: default or compact (id, category, title only)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "guidelines search",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GuidelinesSearchDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGuidelinesSearchDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Guidelines search dependencies were not initialized.");
    }
    await guidelinesSearch(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelinesSearch(
  options: {
    category?: string;
    title?: string;
    query?: string;
    output?: string;
  },
  container: GuidelinesSearchDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    if (
      options.category &&
      !VALID_GUIDELINE_CATEGORIES.includes(
        options.category as GuidelineCategoryValue,
      )
    ) {
      renderer.error(
        `Invalid category: ${options.category}. Must be one of: ${VALID_GUIDELINE_CATEGORIES.join(", ")}`,
      );
      process.exit(1);
    }

    const outputFormat: GuidelineSearchOutputFormat =
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

    const criteria: GuidelineSearchCriteria = {
      ...(options.category && {
        category: options.category as GuidelineCategoryValue,
      }),
      ...(options.title && { title: options.title }),
      ...(options.query && { query: options.query }),
    };

    const request: SearchGuidelinesRequest = { criteria };
    const { guidelines } =
      await container.searchGuidelinesController.handle(request);

    const outputBuilder = new GuidelineSearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(guidelines, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        guidelines,
        outputFormat,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to search guidelines",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
