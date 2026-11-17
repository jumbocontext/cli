/**
 * CLI Command: jumbo goal pause
 *
 * Pauses an active goal (transitions status from 'doing' to 'paused').
 *
 * Usage:
 *   jumbo goal pause --id <goalId> --reason <reason> [--note "..."]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { PauseGoalController } from "../../../../../application/context/goals/pause/PauseGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import type { GoalPausedReasonsType } from "../../../../../domain/goals/GoalPausedReasons.js";
import { GoalPauseOutputBuilder } from "./GoalPauseOutputBuilder.js";
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
    command: "jumbo goal pause --id abc123 --reason ContextCompressed",
    description: "Pause a goal due to context compression",
  },
  {
    command:
      'jumbo goal pause --id abc123 --reason Other --note "Need to switch priorities"',
    description: "Pause a goal with a custom note",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal resume", "goal start", "goal block"];

/**
 * The abstract ports the `goal pause` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalPauseDependencies {
  readonly pauseGoalController: PauseGoalController;
}

/**
 * Composes exactly the features the `goal pause` leaf uses.
 */
async function createGoalPauseDependencies(): Promise<GoalPauseDependencies> {
  return new LeafContainerBuilder().withPauseGoalFeature().build();
}

/** Registers the `goal pause` leaf under the parent supplied by its group. */
export function registerGoalPauseCommand(goal: Command): void {
  const command = goal
    .command("pause")
    .description("Pause an active goal (transitions status from 'doing' to 'paused')")
    .option("-i, --id <id>", "ID of the goal to pause")
    .option(
      "-r, --reason <reason>",
      "Reason for pausing (ContextCompressed, WorkPaused, Other)",
    )
    .option("-N, --note <note>", "Optional note providing additional context");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal pause",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalPauseDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalPauseDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Goal pause dependencies were not initialized.");
    await goalPause(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalPause(
  options: { id: string; reason: string; note?: string },
  container: GoalPauseDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalPauseOutputBuilder();

  try {
    const response = await container.pauseGoalController.handle({
      goalId: options.id,
      reason: options.reason as GoalPausedReasonsType,
      note: options.note,
    });

    const output = outputBuilder.buildSuccess(
      response.goalId,
      response.objective,
      response.status,
      response.reason as GoalPausedReasonsType,
    );
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
