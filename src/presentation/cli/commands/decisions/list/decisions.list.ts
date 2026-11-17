/**
 * CLI Command: jumbo decisions list
 *
 * Lists all architectural decisions (ADRs) with optional status filtering.
 *
 * Usage:
 *   jumbo decisions list
 *   jumbo decisions list --status active
 *   jumbo decisions list --status superseded --format json
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetDecisionsController } from "../../../../../application/context/decisions/get/GetDecisionsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { DecisionStatusFilter } from "../../../../../application/context/decisions/get/IDecisionViewReader.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { DecisionListOutputBuilder } from "./DecisionListOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo decisions list",
    description: "List all decisions",
  },
  {
    command: "jumbo decisions list --status active",
    description: "List only active decisions",
  },
  {
    command: "jumbo decisions list --status superseded --format json",
    description: "List superseded decisions as JSON",
  },
];

const RELATED_COMMANDS = [
  "decision add",
  "decision update",
  "decision reverse",
  "decision supersede",
];

/**
 * Validate status filter
 */
function isValidStatus(status: string): status is DecisionStatusFilter {
  return ["active", "superseded", "reversed", "all"].includes(status);
}

/**
 * The abstract ports the `decisions list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface DecisionsListDependencies {
  readonly getDecisionsController: GetDecisionsController;
}

/**
 * Composes exactly the feature the `decisions list` leaf uses.
 */
async function createDecisionsListDependencies(): Promise<DecisionsListDependencies> {
  return new LeafContainerBuilder().withGetDecisionsFeature().build();
}

/** Registers the `decisions list` leaf under the parent supplied by its group. */
export function registerDecisionsListCommand(decisions: Command): void {
  const command = decisions
    .command("list")
    .description("List all architectural decisions (ADRs)")
    .option(
      "-s, --status <status>",
      "Filter by status: active, superseded, reversed, or all (default: all)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "decisions list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.solution,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: DecisionsListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createDecisionsListDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Decisions list dependencies were not initialized.");
    await decisionsList(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionsList(
  options: { status?: string },
  container: DecisionsListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate and normalize status filter
    const statusFilter = options.status || "all";
    if (!isValidStatus(statusFilter)) {
      renderer.error(
        `Invalid status: ${statusFilter}. Must be one of: active, superseded, reversed, all`,
      );
      process.exit(1);
    }

    // Delegate to controller
    const { decisions } = await container.getDecisionsController.handle({
      status: statusFilter,
    });

    if (decisions.length === 0) {
      const filterMsg =
        statusFilter === "all" ? "" : ` with status '${statusFilter}'`;
      renderer.info(
        `No decisions found${filterMsg}. Use 'jumbo decision add' to add one.`,
      );
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();

    const outputBuilder = new DecisionListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(decisions, statusFilter);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        decisions,
        statusFilter,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list decisions",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
