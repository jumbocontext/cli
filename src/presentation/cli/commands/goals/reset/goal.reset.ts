/**
 * CLI Command: jumbo goal reset
 *
 * Resets a goal back to its last waiting state.
 * Blocked goals cannot be reset to preserve blocker context.
 * Goals already in a waiting state cannot be reset.
 *
 * Usage:
 *   jumbo goal reset --id <goalId>
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ResetGoalController } from "../../../../../application/context/goals/reset/ResetGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalResetOutputBuilder } from "./GoalResetOutputBuilder.js";
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
    command: "jumbo goal reset --id abc123",
    description: "Reset a goal to its last waiting state",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal start", "goal unblock", "goal pause"];

/**
 * The abstract ports the `goal reset` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalResetDependencies {
  readonly resetGoalController: ResetGoalController;
}

/**
 * Composes exactly the features the `goal reset` leaf uses.
 */
async function createGoalResetDependencies(): Promise<GoalResetDependencies> {
  return new LeafContainerBuilder().withResetGoalFeature().build();
}

/** Registers the `goal reset` leaf under the parent supplied by its group. */
export function registerGoalResetCommand(goal: Command): void {
  const command = goal
    .command("reset")
    .description("Reset a goal back to its last waiting state")
    .option("-i, --id <id>", "ID of the goal to reset");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal reset",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalResetDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalResetDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Goal reset dependencies were not initialized.");
    await goalReset(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReset(
  options: { id: string },
  container: GoalResetDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalResetOutputBuilder();

  try {
    const response = await container.resetGoalController.handle({
      goalId: options.id,
    });

    // Build and render success output
    const output = outputBuilder.buildSuccess(
      response.goalId,
      response.objective,
      response.status,
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
