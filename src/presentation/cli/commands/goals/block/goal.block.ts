/**
 * CLI Command: jumbo goal block
 *
 * Blocks a goal with a reason when progress is impeded.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { BlockGoalController } from "../../../../../application/context/goals/block/BlockGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { GoalBlockOutputBuilder } from "./GoalBlockOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: 'jumbo goal block --id abc123 --note "Waiting for API credentials"',
    description: "Block a goal with a reason",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal unblock", "goal start", "goal add"];

/**
 * The abstract ports the `goal block` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalBlockDependencies {
  readonly blockGoalController: BlockGoalController;
}

/**
 * Composes exactly the feature the `goal block` leaf uses.
 */
async function createGoalBlockDependencies(): Promise<GoalBlockDependencies> {
  return new LeafContainerBuilder().withBlockGoalFeature().build();
}

/** Registers the `goal block` leaf under the parent supplied by its group. */
export function registerGoalBlockCommand(goal: Command): void {
  const command = goal
    .command("block")
    .description("Mark a goal as blocked with reason")
    .requiredOption("-i, --id <id>", "ID of the goal to block")
    .requiredOption("-N, --note <reason>", "Reason why the goal is blocked");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal block",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalBlockDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalBlockDependencies();
  });

  command.action(async (options: { id: string; note: string }) => {
    if (!dependencies) throw new Error("Goal block dependencies were not initialized.");
    await goalBlock(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalBlock(
  options: { id: string; note: string },
  container: GoalBlockDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalBlockOutputBuilder();

  try {
    const { goalId, note } = await container.blockGoalController.handle({
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
