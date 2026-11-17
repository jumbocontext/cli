/**
 * CLI Command: jumbo goal unblock
 *
 * Unblocks a goal and resumes work after a blocker has been resolved.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UnblockGoalController } from "../../../../../application/context/goals/unblock/UnblockGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { GoalUnblockOutputBuilder } from "./GoalUnblockOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo goal unblock --id abc123",
    description: "Unblock a goal",
  },
  {
    command:
      'jumbo goal unblock --id abc123 --note "API credentials received"',
    description: "Unblock a goal with resolution note",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal block", "goal start", "goal complete"];

/**
 * The abstract ports the `goal unblock` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalUnblockDependencies {
  readonly unblockGoalController: UnblockGoalController;
}

/**
 * Composes exactly the feature the `goal unblock` leaf uses.
 */
async function createGoalUnblockDependencies(): Promise<GoalUnblockDependencies> {
  return new LeafContainerBuilder().withUnblockGoalFeature().build();
}

/** Registers the `goal unblock` leaf under the parent supplied by its group. */
export function registerGoalUnblockCommand(goal: Command): void {
  const command = goal
    .command("unblock")
    .description("Unblock a goal and resume work")
    .requiredOption("-i, --id <id>", "ID of the goal to unblock")
    .option(
      "-N, --note <resolution>",
      "Optional resolution note explaining how the blocker was resolved",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal unblock",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalUnblockDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalUnblockDependencies();
  });

  command.action(async (options: { id: string; note?: string }) => {
    if (!dependencies) throw new Error("Goal unblock dependencies were not initialized.");
    await goalUnblock(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalUnblock(
  options: { id: string; note?: string },
  container: GoalUnblockDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalUnblockOutputBuilder();

  try {
    const { goalId, note } = await container.unblockGoalController.handle({
      goalId: options.id,
      note: options.note,
    });

    // Build and render success output
    const output = outputBuilder.buildSuccess(goalId, note);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
