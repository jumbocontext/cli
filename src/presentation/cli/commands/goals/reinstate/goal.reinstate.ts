/**
 * CLI Command: jumbo goal reinstate
 *
 * Reinstates a postponed goal so it becomes eligible for refinement again.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ReinstateGoalController } from "../../../../../application/context/goals/reinstate/ReinstateGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { GoalReinstateOutputBuilder } from "./GoalReinstateOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo goal reinstate --id abc123",
    description:
      "Return a postponed goal to defined status and renewed refinement eligibility",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goals list", "goal postpone", "goal refine"];

/**
 * The abstract ports the `goal reinstate` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GoalReinstateDependencies {
  readonly reinstateGoalController: ReinstateGoalController;
}

/**
 * Composes exactly the feature the `goal reinstate` leaf uses.
 */
async function createGoalReinstateDependencies(): Promise<GoalReinstateDependencies> {
  return new LeafContainerBuilder().withReinstateGoalFeature().build();
}

/** Registers the `goal reinstate` leaf under the parent supplied by its group. */
export function registerGoalReinstateCommand(goal: Command): void {
  const command = goal
    .command("reinstate")
    .description(
      "Reinstate a postponed goal as defined so it is eligible for refinement",
    )
    .requiredOption(
      "-i, --id <id>",
      "ID of the postponed goal to reinstate",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal reinstate",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalReinstateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalReinstateDependencies();
  });

  command.action(async (options: { id: string }) => {
    if (!dependencies) {
      throw new Error("Goal reinstate dependencies were not initialized.");
    }
    await goalReinstate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReinstate(
  options: { id: string },
  container: GoalReinstateDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalReinstateOutputBuilder();

  try {
    const response = await container.reinstateGoalController.handle({
      goalId: options.id,
    });

    // Build and render success output
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
