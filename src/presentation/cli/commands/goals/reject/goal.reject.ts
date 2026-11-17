/**
 * CLI Command: jumbo goal reject
 *
 * Rejects a goal after failed QA review.
 * Transitions goal from 'in-review' to 'rejected' status,
 * records review issues, and releases the reviewer's claim.
 *
 * Usage:
 *   jumbo goal reject --id abc123 --review-issues "..."
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { RejectGoalController } from "../../../../../application/context/goals/reject/RejectGoalController.js";
import { RejectGoalRequest } from "../../../../../application/context/goals/reject/RejectGoalRequest.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalRejectOutputBuilder } from "./GoalRejectOutputBuilder.js";
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
      'jumbo goal reject --id abc123 --review-issues "Missing error handling in API endpoint"',
    description: "Reject a goal with review issues",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal review", "goal approve", "goal start"];

/**
 * The abstract ports the `goal reject` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalRejectDependencies {
  readonly rejectGoalController: RejectGoalController;
}

/**
 * Composes exactly the features the `goal reject` leaf uses.
 */
async function createGoalRejectDependencies(): Promise<GoalRejectDependencies> {
  return new LeafContainerBuilder().withRejectGoalFeature().build();
}

/** Registers the `goal reject` leaf under the parent supplied by its group. */
export function registerGoalRejectCommand(goal: Command): void {
  const command = goal
    .command("reject")
    .description("Reject a goal after failed QA review")
    .option("-i, --id <id>", "ID of the goal to reject")
    .option(
      "-r, --review-issues <issues>",
      "Description of implementation problems that need fixing",
    )
    .option(
      "--continue",
      "Return control to the implementing agent after rejection",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal reject",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalRejectDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalRejectDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Goal reject dependencies were not initialized.");
    await goalReject(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReject(
  options: {
    id?: string;
    reviewIssues?: string;
    continue?: boolean;
  },
  container: GoalRejectDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalRejectOutputBuilder();

  try {
    if (!options.id) {
      renderer.error("--id is required");
      process.exit(1);
    }

    if (!options.reviewIssues) {
      renderer.error("--review-issues is required");
      process.exit(1);
    }

    // 1. Create request
    const request: RejectGoalRequest = {
      goalId: options.id,
      reviewIssues: options.reviewIssues,
    };

    // 2. Handle request
    const response = await container.rejectGoalController.handle(request);

    // 3. Build and render output using builder pattern
    const output = outputBuilder.buildSuccess(
      response,
      options.continue === true,
    );
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const errorOutput = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.error(errorOutput.toHumanReadable());
    process.exit(1);
  }
}
