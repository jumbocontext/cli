/**
 * CLI Command: jumbo decisions search
 *
 * Searches decisions by status, title, and free-text query across decision fields.
 * Filters combine with AND logic.
 *
 * Usage:
 *   jumbo decisions search --title architecture
 *   jumbo decisions search --status active
 *   jumbo decisions search --query "stdout" --output compact
 *   jumbo decisions search --title Clean* --format json
 */

import type { Command } from "commander";
import { DecisionStatusFilter } from "../../../../../application/context/decisions/get/IDecisionViewReader.js";
import { DecisionSearchCriteria } from "../../../../../application/context/decisions/search/DecisionSearchCriteria.js";
import { SearchDecisionsRequest } from "../../../../../application/context/decisions/search/SearchDecisionsRequest.js";
import type { SearchDecisionsController } from "../../../../../application/context/decisions/search/SearchDecisionsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  DecisionSearchOutputBuilder,
  DecisionSearchOutputFormat,
} from "./DecisionSearchOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

const VALID_DECISION_STATUSES: readonly DecisionStatusFilter[] = [
  "active",
  "superseded",
  "reversed",
  "all",
];

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo decisions search --title architecture",
    description: "Search decisions by title",
  },
  {
    command: "jumbo decisions search --status active",
    description: "Search active decisions",
  },
  {
    command:
      'jumbo decisions search --query "event handling" --output compact',
    description: "Free-text search with compact output",
  },
];

const RELATED_COMMANDS = [
  "decisions list",
  "decision add",
  "decision update",
  "decision reverse",
  "decision supersede",
];

/**
 * The abstract ports the `decisions search` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DecisionsSearchDependencies {
  readonly searchDecisionsController: SearchDecisionsController;
}

/**
 * Composes exactly the feature the `decisions search` leaf uses.
 */
async function createDecisionsSearchDependencies(): Promise<DecisionsSearchDependencies> {
  return new LeafContainerBuilder().withSearchDecisionsFeature().build();
}

/** Registers the `decisions search` leaf under the parent supplied by its group. */
export function registerDecisionsSearchCommand(decisions: Command): void {
  const command = decisions
    .command("search")
    .description(
      "Search architectural decisions by status, title, or free-text query",
    )
    .option(
      "-t, --title <title>",
      "Filter by title (substring match, or use * for wildcards: Clean*, *Architecture)",
    )
    .option(
      "-s, --status <status>",
      "Filter by status: active, superseded, reversed, or all (default: all)",
    )
    .option(
      "-q, --query <query>",
      "Free-text search across title, context, rationale, alternatives, consequences, reversal reason, and superseded-by fields (supports * wildcards)",
    )
    .option(
      "-o, --output <output>",
      "Output detail level: default or compact (id, title, status only)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decisions search",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionsSearchDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionsSearchDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Decisions search dependencies were not initialized.");
    await decisionsSearch(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionsSearch(
  options: { title?: string; status?: string; query?: string; output?: string },
  container: DecisionsSearchDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const statusFilter = options.status || "all";
    if (
      !VALID_DECISION_STATUSES.includes(statusFilter as DecisionStatusFilter)
    ) {
      renderer.error(
        `Invalid status: ${statusFilter}. Must be one of: active, superseded, reversed, all`,
      );
      process.exit(1);
    }

    const outputFormat: DecisionSearchOutputFormat =
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

    const criteria: DecisionSearchCriteria = {
      status: statusFilter as DecisionStatusFilter,
      ...(options.title && { title: options.title }),
      ...(options.query && { query: options.query }),
    };

    const request: SearchDecisionsRequest = { criteria };
    const { decisions } =
      await container.searchDecisionsController.handle(request);

    const outputBuilder = new DecisionSearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(decisions, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        decisions,
        outputFormat,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to search decisions",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
