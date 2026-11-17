/**
 * CLI Command: jumbo goal start
 *
 * Starts a refined goal (transitions status from 'refined' to 'doing').
 *
 * Usage:
 *   jumbo goal start --id <goalId>
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { StartGoalController } from "../../../../../application/context/goals/start/StartGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalStartOutputBuilder } from "./GoalStartOutputBuilder.js";
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
    command: "jumbo goal start --id abc123",
    description: "Start working on the goal with ID 'abc123'",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal refine", "goal update-progress", "goal complete"];

/**
 * The abstract ports the `goal start` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalStartDependencies {
  readonly startGoalController: StartGoalController;
}

/**
 * Composes exactly the features the `goal start` leaf uses.
 */
async function createGoalStartDependencies(): Promise<GoalStartDependencies> {
  return new LeafContainerBuilder().withStartGoalFeature().build();
}

/** Registers the `goal start` leaf under the parent supplied by its group. */
export function registerGoalStartCommand(goal: Command): void {
  const command = goal
    .command("start")
    .description("Start a refined goal (transitions status from 'refined' to 'doing')")
    .requiredOption("-i, --id <id>", "ID of the goal to start");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal start",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalStartDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalStartDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) throw new Error("Goal start dependencies were not initialized.");
    await goalStart(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalStart(
  options: { id: string },
  container: GoalStartDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.startGoalController.handle({
      goalId: options.id,
    });

    // Build and render output using builder pattern
    const outputBuilder = new GoalStartOutputBuilder();
    const output = outputBuilder.build(response.goalContextView);

    renderer.info(output.toHumanReadable());
  } catch (error) {
    renderer.error(
      "Failed to start goal",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
