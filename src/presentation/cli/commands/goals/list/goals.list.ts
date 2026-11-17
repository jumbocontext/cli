/**
 * CLI Command: jumbo goals list
 *
 * Lists goals filtered by status.
 *
 * Usage:
 *   jumbo goals list
 *   jumbo goals list --status doing
 *   jumbo goals list --status doing,blocked,paused
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetGoalsController } from "../../../../../application/context/goals/get/GetGoalsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { GoalStatus } from "../../../../../domain/goals/Constants.js";
import { GoalListOutputBuilder } from "./GoalListOutputBuilder.js";

/**
 * Valid goal statuses, accepted as a comma-separated list via --status.
 * Sourced from the domain's GoalStatus enum.
 */
const VALID_STATUSES: readonly string[] = Object.values(GoalStatus);

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo goals list",
    description: "List all active (non-completed) goals",
  },
  {
    command: "jumbo goals list --status doing",
    description: "List only goals currently being worked on",
  },
  {
    command: "jumbo goals list --status doing,blocked",
    description: "List goals that are doing or blocked",
  },
];

/**
 * The abstract ports the `goals list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GoalsListDependencies {
  readonly getGoalsController: GetGoalsController;
}

/**
 * Composes exactly the feature the `goals list` leaf uses.
 */
async function createGoalsListDependencies(): Promise<GoalsListDependencies> {
  return new LeafContainerBuilder().withGetGoalsFeature().build();
}

/** Registers the `goals list` leaf under the parent supplied by its group. */
export function registerGoalsListCommand(goals: Command): void {
  const command = goals
    .command("list")
    .description("List goals filtered by status")
    .option(
      "-s, --status <statuses>",
      `Filter by status (comma-separated). Valid: ${VALID_STATUSES.join(", ")}`,
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goals list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
      }),
    });

  let dependencies: GoalsListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalsListDependencies();
  });

  command.action(async (options: { status?: string }) => {
    if (!dependencies) {
      throw new Error("Goals list dependencies were not initialized.");
    }
    await goalsList(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalsList(
  options: { status?: string },
  container: GoalsListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const statuses = options.status
      ? options.status.split(",").map((s) => s.trim())
      : undefined;

    const { goals } = await container.getGoalsController.handle({ statuses });

    const outputBuilder = new GoalListOutputBuilder();

    if (goals.length === 0) {
      const message = options.status
        ? `No goals found with status: ${statuses!.join(", ")}`
        : "No active goals. All goals are completed.";
      const output = outputBuilder.buildNoGoalsFound(message);
      renderer.info(output.toHumanReadable());
      return;
    }

    // Preserve TTY vs pipe behavior: formatted text for humans, JSON for machines
    if (process.stdout.isTTY) {
      const output = outputBuilder.buildActiveGoalsList(goals);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(goals);
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) {
        renderer.data(dataSection.content as Record<string, unknown>);
      }
    }
  } catch (error) {
    renderer.error(
      "Failed to list goals",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
