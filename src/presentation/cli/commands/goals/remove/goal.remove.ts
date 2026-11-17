/**
 * CLI Command: jumbo goal remove
 *
 * Removes a goal from tracking (does not delete event history).
 *
 * Usage:
 *   jumbo goal remove --id <goalId>
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RemoveGoalController } from "../../../../../application/context/goals/remove/RemoveGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalRemoveOutputBuilder } from "./GoalRemoveOutputBuilder.js";
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
    command: "jumbo goal remove --id abc123",
    description: "Remove a goal from tracking",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal add", "goal complete", "goal close"];

/**
 * The abstract ports the `goal remove` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalRemoveDependencies {
  readonly removeGoalController: RemoveGoalController;
}

/**
 * Composes exactly the features the `goal remove` leaf uses.
 */
async function createGoalRemoveDependencies(): Promise<GoalRemoveDependencies> {
  return new LeafContainerBuilder().withRemoveGoalFeature().build();
}

/** Registers the `goal remove` leaf under the parent supplied by its group. */
export function registerGoalRemoveCommand(goal: Command): void {
  const command = goal
    .command("remove")
    .description("Remove a goal from tracking")
    .option("-i, --id <id>", "ID of the goal to remove");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal remove",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalRemoveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalRemoveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Goal remove dependencies were not initialized.");
    await goalRemove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalRemove(
  options: { id: string },
  container: GoalRemoveDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalRemoveOutputBuilder();

  try {
    const response = await container.removeGoalController.handle({
      goalId: options.id,
    });

    const output = outputBuilder.buildSuccess(
      response.goalId,
      response.objective,
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
