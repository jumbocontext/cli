/**
 * CLI Command: jumbo goal update-progress
 *
 * Appends a task description to a goal's progress array.
 *
 * Usage:
 *   jumbo goal update-progress --id <id> --task-description "..."
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateGoalProgressController } from "../../../../../application/context/goals/update-progress/UpdateGoalProgressController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalUpdateProgressOutputBuilder } from "./GoalUpdateProgressOutputBuilder.js";
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
    command:
      'jumbo goal update-progress --id abc123 --task-description "Implemented user login form"',
    description: "Record progress on a goal",
  },
  {
    command:
      'jumbo goal update-progress --id abc123 --task-description "Fixed flaky auth test"',
    description: "Append another progress entry to the same goal",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal start", "goal complete", "goal show"];

/**
 * The abstract ports the `goal update-progress` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalUpdateProgressDependencies {
  readonly updateGoalProgressController: UpdateGoalProgressController;
}

/**
 * Composes exactly the features the `goal update-progress` leaf uses.
 */
async function createGoalUpdateProgressDependencies(): Promise<GoalUpdateProgressDependencies> {
  return new LeafContainerBuilder().withUpdateGoalProgressFeature().build();
}

/** Registers the `goal update-progress` leaf under the parent supplied by its group. */
export function registerGoalUpdateProgressCommand(goal: Command): void {
  const command = goal
    .command("update-progress")
    .description("Append a task description to a goal's progress")
    .requiredOption("-i, --id <id>", "ID of the goal to update progress on")
    .requiredOption(
      "--task-description <taskDescription>",
      "Description of the completed sub-task",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal update-progress",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalUpdateProgressDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalUpdateProgressDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error(
        "Goal update-progress dependencies were not initialized.",
      );
    }
    await goalUpdateProgress(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalUpdateProgress(
  options: {
    id: string;
    taskDescription: string;
  },
  container: GoalUpdateProgressDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateGoalProgressController.handle({
      goalId: options.id,
      taskDescription: options.taskDescription,
    });

    // Build and render output using builder pattern
    const outputBuilder = new GoalUpdateProgressOutputBuilder();
    const output = outputBuilder.build(
      response.goalContextView,
      options.taskDescription.trim(),
    );

    renderer.info(output.toHumanReadable());
  } catch (error) {
    renderer.error(
      "Failed to update progress",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
