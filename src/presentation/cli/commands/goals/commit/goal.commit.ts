/**
 * CLI Command: jumbo goal commit
 *
 * Commits a goal after refinement is complete.
 * Transitions goal from 'in-refinement' to 'refined' status and releases the claim.
 *
 * Usage:
 *   jumbo goal commit --id abc123 [--continue]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { CommitGoalController } from "../../../../../application/context/goals/commit/CommitGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalCommitOutputBuilder } from "./GoalCommitOutputBuilder.js";
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
    command: "jumbo goal commit --id abc123",
    description: "Commit the goal after refinement is complete",
  },
  {
    command: "jumbo goal commit --id abc123 --continue",
    description: "Commit the goal and hand off to the next agent",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal refine", "goal start", "relation add"];

/**
 * The abstract ports the `goal commit` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GoalCommitDependencies {
  readonly commitGoalController: CommitGoalController;
}

/**
 * Composes exactly the features the `goal commit` leaf uses.
 */
async function createGoalCommitDependencies(): Promise<GoalCommitDependencies> {
  return new LeafContainerBuilder().withCommitGoalFeature().build();
}

/** Registers the `goal commit` leaf under the parent supplied by its group. */
export function registerGoalCommitCommand(goal: Command): void {
  const command = goal
    .command("commit")
    .description("Commit a goal after refinement is complete")
    .option("-i, --id <id>", "ID of the goal to commit")
    .option(
      "--continue",
      "Signal continuation to a collaborating agent after committing",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal commit",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalCommitDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalCommitDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Goal commit dependencies were not initialized.");
    await goalCommit(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalCommit(
  options: { id?: string; continue?: boolean },
  container: GoalCommitDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalCommitOutputBuilder();

  try {
    if (!options.id) {
      renderer.error("--id is required");
      process.exit(1);
    }

    // 1. Execute via controller
    const response = await container.commitGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    const output = outputBuilder.buildSuccess(
      response.goalId,
      response.status,
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
