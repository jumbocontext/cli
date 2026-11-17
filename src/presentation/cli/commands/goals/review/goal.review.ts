/**
 * CLI Command: jumbo goal review
 *
 * Starts QA review on a submitted goal.
 * Transitions goal from 'submitted' to 'in-review' status and renders QA criteria.
 *
 * Usage:
 *   jumbo goal review --id abc123
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ReviewGoalController } from "../../../../../application/context/goals/review/ReviewGoalController.js";
import { ReviewGoalRequest } from "../../../../../application/context/goals/review/ReviewGoalRequest.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalReviewOutputBuilder } from "./GoalReviewOutputBuilder.js";
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
    command: "jumbo goal review --id abc123",
    description: "Start QA review on a submitted goal",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal submit", "goal approve", "goal reject"];

/**
 * The abstract ports the `goal review` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalReviewDependencies {
  readonly reviewGoalController: ReviewGoalController;
}

/**
 * Composes exactly the features the `goal review` leaf uses.
 */
async function createGoalReviewDependencies(): Promise<GoalReviewDependencies> {
  return new LeafContainerBuilder().withReviewGoalFeature().build();
}

/** Registers the `goal review` leaf under the parent supplied by its group. */
export function registerGoalReviewCommand(goal: Command): void {
  const command = goal
    .command("review")
    .description("Start QA review on a submitted goal")
    .option("-i, --id <id>", "ID of the goal to review");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal review",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalReviewDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalReviewDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Goal review dependencies were not initialized.");
    await goalReview(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReview(
  options: { id?: string },
  container: GoalReviewDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalReviewOutputBuilder();

  try {
    if (!options.id) {
      renderer.error("--id is required");
      process.exit(1);
    }

    // 1. Create request
    const request: ReviewGoalRequest = {
      goalId: options.id,
    };

    // 2. Handle request
    const response = await container.reviewGoalController.handle(request);

    // 3. Build and render output using builder pattern
    const output = outputBuilder.buildSuccess(response);
    renderer.info(output.toHumanReadable());
    renderer.divider();
  } catch (error) {
    const errorOutput = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.error(errorOutput.toHumanReadable());
    process.exit(1);
  }
}
