/**
 * CLI Command: jumbo goal codify
 *
 * Starts the codify phase on an approved goal.
 * Transitions goal from 'approved' to 'codifying' status and acquires a claim.
 *
 * Usage:
 *   jumbo goal codify --id abc123
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { CodifyGoalController } from "../../../../../application/context/goals/codify/CodifyGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalCodifyOutputBuilder } from "./GoalCodifyOutputBuilder.js";
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
    command: "jumbo goal codify --id abc123",
    description: "Start codifying an approved goal",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal approve", "goal close"];

/**
 * The abstract ports the `goal codify` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface GoalCodifyDependencies {
  readonly codifyGoalController: CodifyGoalController;
}

/**
 * Composes exactly the features the `goal codify` leaf uses.
 */
async function createGoalCodifyDependencies(): Promise<GoalCodifyDependencies> {
  return new LeafContainerBuilder().withCodifyGoalFeature().build();
}

/** Registers the `goal codify` leaf under the parent supplied by its group. */
export function registerGoalCodifyCommand(goal: Command): void {
  const command = goal
    .command("codify")
    .description(
      "Start the codify phase on an approved goal (architectural reconciliation)",
    )
    .option("-i, --id <id>", "ID of the goal to codify");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal codify",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalCodifyDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalCodifyDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Goal codify dependencies were not initialized.");
    await goalCodify(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalCodify(
  options: { id?: string },
  container: GoalCodifyDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalCodifyOutputBuilder();

  try {
    if (!options.id) {
      renderer.error("--id is required");
      process.exit(1);
    }

    // 1. Execute via controller
    const response = await container.codifyGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    const output = outputBuilder.buildSuccess(response);

    renderer.info(output.toHumanReadable());
  } catch (error) {
    const errorOutput = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.error(errorOutput.toHumanReadable());
    process.exit(1);
  }
}
