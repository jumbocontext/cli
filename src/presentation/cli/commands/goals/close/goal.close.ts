/**
 * CLI Command: jumbo goal close
 *
 * Closes a goal after codification is complete.
 * Transitions goal from 'codifying' to 'done' status and releases the claim.
 *
 * Usage:
 *   jumbo goal close --id abc123 [--continue]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { CloseGoalController } from "../../../../../application/context/goals/close/CloseGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalCloseOutputBuilder } from "./GoalCloseOutputBuilder.js";
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
    command: "jumbo goal close --id abc123",
    description: "Close a goal after codification",
  },
  {
    command: "jumbo goal close --id abc123 --continue",
    description: "Close a goal and prompt to start the next chained goal",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal codify", "goal start"];

/**
 * The abstract ports the `goal close` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GoalCloseDependencies {
  readonly closeGoalController: CloseGoalController;
}

/**
 * Composes exactly the features the `goal close` leaf uses.
 */
async function createGoalCloseDependencies(): Promise<GoalCloseDependencies> {
  return new LeafContainerBuilder().withCloseGoalFeature().build();
}

/** Registers the `goal close` leaf under the parent supplied by its group. */
export function registerGoalCloseCommand(goal: Command): void {
  const command = goal
    .command("close")
    .description(
      "Close a goal after codification is complete (transitions to done)",
    )
    .option("-i, --id <id>", "ID of the goal to close")
    .option(
      "--continue",
      "Continue to the next chained goal immediately after closing",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal close",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalCloseDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalCloseDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Goal close dependencies were not initialized.");
    await goalClose(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalClose(
  options: { id?: string; continue?: boolean },
  container: GoalCloseDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalCloseOutputBuilder();

  try {
    if (!options.id) {
      renderer.error("--id is required");
      process.exit(1);
    }

    // 1. Execute via controller
    const response = await container.closeGoalController.handle({
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
