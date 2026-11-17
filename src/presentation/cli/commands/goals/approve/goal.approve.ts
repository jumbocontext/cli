/**
 * CLI Command: jumbo goal approve
 *
 * Approves a goal after successful QA review.
 * Transitions goal from 'in-review' to 'approved' status and renders codification instructions.
 *
 * Usage:
 *   jumbo goal approve --id abc123 [--continue]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { QualifyGoalController } from "../../../../../application/context/goals/qualify/QualifyGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalApproveOutputBuilder } from "./GoalApproveOutputBuilder.js";
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
    command: "jumbo goal approve --id abc123",
    description: "Approve a goal after QA review passes",
  },
  {
    command: "jumbo goal approve --id abc123 --continue",
    description: "Approve a goal and print codification instructions",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal review", "goal complete", "goal start"];

/**
 * The abstract ports the `goal approve` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GoalApproveDependencies {
  readonly qualifyGoalController: QualifyGoalController;
}

/**
 * Composes exactly the features the `goal approve` leaf uses.
 */
async function createGoalApproveDependencies(): Promise<GoalApproveDependencies> {
  return new LeafContainerBuilder().withQualifyGoalFeature().build();
}

/** Registers the `goal approve` leaf under the parent supplied by its group. */
export function registerGoalApproveCommand(goal: Command): void {
  const command = goal
    .command("approve")
    .description("Approve a goal after successful QA review")
    .option("-i, --id <id>", "ID of the goal to approve")
    .option(
      "--continue",
      "Render codification instructions after approval",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal approve",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalApproveDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalApproveDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Goal approve dependencies were not initialized.");
    await goalApprove(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalApprove(
  options: { id?: string; continue?: boolean },
  container: GoalApproveDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalApproveOutputBuilder();

  try {
    if (!options.id) {
      renderer.error("--id is required");
      process.exit(1);
    }

    // 1. Execute via the existing approval workflow
    const response = await container.qualifyGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
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
