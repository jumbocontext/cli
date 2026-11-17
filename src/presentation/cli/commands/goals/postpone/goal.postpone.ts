/**
 * CLI Command: jumbo goal postpone
 *
 * Postpones a defined goal so automatic work streams skip it.
 *
 * Usage:
 *   jumbo goal postpone --id <goalId>
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { PostponeGoalController } from "../../../../../application/context/goals/postpone/PostponeGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalPostponeOutputBuilder } from "./GoalPostponeOutputBuilder.js";
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
    command: "jumbo goal postpone --id abc123",
    description:
      "Keep a defined goal visible while excluding it from automatic work streams",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goals list", "goal reinstate", "goal pause"];

/**
 * The abstract ports the `goal postpone` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GoalPostponeDependencies {
  readonly postponeGoalController: PostponeGoalController;
}

/**
 * Composes exactly the features the `goal postpone` leaf uses.
 */
async function createGoalPostponeDependencies(): Promise<GoalPostponeDependencies> {
  return new LeafContainerBuilder().withPostponeGoalFeature().build();
}

/** Registers the `goal postpone` leaf under the parent supplied by its group. */
export function registerGoalPostponeCommand(goal: Command): void {
  const command = goal
    .command("postpone")
    .description("Postpone a defined goal so automatic work streams skip it")
    .option("-i, --id <id>", "ID of the defined goal to postpone");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal postpone",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalPostponeDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalPostponeDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Goal postpone dependencies were not initialized.");
    }
    await goalPostpone(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalPostpone(
  options: { id: string },
  container: GoalPostponeDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalPostponeOutputBuilder();

  try {
    const response = await container.postponeGoalController.handle({
      goalId: options.id,
    });

    const output = outputBuilder.buildSuccess(response);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
