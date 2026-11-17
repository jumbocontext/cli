/**
 * CLI Command: jumbo goal submit
 *
 * Submits a goal after implementation is complete.
 * Transitions goal from 'doing' to 'submitted' status and releases the implementer's claim.
 *
 * Usage:
 *   jumbo goal submit --id abc123 [--continue]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { SubmitGoalController } from "../../../../../application/context/goals/submit/SubmitGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalSubmitOutputBuilder } from "./GoalSubmitOutputBuilder.js";
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
    command: "jumbo goal submit --id abc123",
    description: "Submit the goal after implementation is complete",
  },
  {
    command: "jumbo goal submit --id abc123 --continue",
    description: "Submit the goal and hand off to the QA reviewer",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal start", "goal review", "goal reject"];

/**
 * The abstract ports the `goal submit` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalSubmitDependencies {
  readonly submitGoalController: SubmitGoalController;
}

/**
 * Composes exactly the features the `goal submit` leaf uses.
 */
async function createGoalSubmitDependencies(): Promise<GoalSubmitDependencies> {
  return new LeafContainerBuilder().withSubmitGoalFeature().build();
}

/** Registers the `goal submit` leaf under the parent supplied by its group. */
export function registerGoalSubmitCommand(goal: Command): void {
  const command = goal
    .command("submit")
    .description("Submit a goal after implementation is complete")
    .option("-i, --id <id>", "ID of the goal to submit")
    .option(
      "--continue",
      "Signal continuation to a collaborating agent after submitting",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal submit",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalSubmitDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalSubmitDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Goal submit dependencies were not initialized.");
    await goalSubmit(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalSubmit(
  options: { id?: string; continue?: boolean },
  container: GoalSubmitDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalSubmitOutputBuilder();

  try {
    if (!options.id) {
      renderer.error("--id is required");
      process.exit(1);
    }

    // 1. Execute via controller
    const response = await container.submitGoalController.handle({
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
