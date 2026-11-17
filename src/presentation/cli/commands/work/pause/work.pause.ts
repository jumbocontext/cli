/**
 * CLI Command: jumbo work pause
 *
 * Pauses the current worker's active goal (transitions status from 'doing' to 'paused').
 * This is a parameterless command that automatically identifies the worker's active goal.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { PauseWorkController } from "../../../../../application/context/work/pause/PauseWorkController.js";
import type { ILogger } from "../../../../../application/logging/ILogger.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
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
    command: "jumbo work pause",
    description: "Pause your active goal",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["work resume", "goal pause", "goal start"];

/**
 * The abstract ports the `work pause` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface WorkPauseDependencies {
  readonly pauseWorkController: PauseWorkController;
  readonly logger: ILogger;
}

/**
 * Composes exactly the features the `work pause` leaf uses.
 */
async function createWorkPauseDependencies(): Promise<WorkPauseDependencies> {
  return new LeafContainerBuilder().withPauseWorkFeature().build();
}

/** Registers the `work pause` leaf under the parent supplied by its group. */
export function registerWorkPauseCommand(work: Command): void {
  const command = work
    .command("pause")
    .description("Pause the current worker's active goal");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "work pause",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: WorkPauseDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createWorkPauseDependencies();
  });

  command.action(async () => {
    if (!dependencies)
      throw new Error("Work pause dependencies were not initialized.");
    await workPause(dependencies);
  });
}

/**
 * Command handler
 * Called by Commander once the leaf container is composed
 */
export async function workPause(container: WorkPauseDependencies) {
  const renderer = Renderer.getInstance();

  try {
    container.logger.debug("[work.pause] Starting workPause command");

    container.logger.debug("[work.pause] About to execute controller");
    // Execute via controller
    const result = await container.pauseWorkController.handle({});

    container.logger.info(
      "[work.pause] Successfully executed PauseWorkController",
    );

    // Success output
    renderer.success("Work paused", {
      goalId: result.goalId,
      objective: result.objective,
      status: "paused",
      reason: "WorkPaused",
    });
  } catch (error) {
    // Check if this is a "no active goal" scenario (not an error for hooks)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNoActiveGoal = errorMessage.includes("No active goal found");

    // Log to file
    container.logger.error(
      "[work.pause] ERROR caught in workPause",
      error instanceof Error ? error : new Error(String(error)),
      { errorType: typeof error, isNoActiveGoal },
    );

    // Flush logger before exiting to ensure error is written
    if (container.logger.flush) {
      await container.logger.flush();
    }

    if (isNoActiveGoal) {
      // Not an error - just no work to pause. Exit cleanly for hooks.
      renderer.info("No active goal to pause");
    } else {
      // Actual error - render error and fail
      renderer.error(
        "Failed to pause work",
        error instanceof Error ? error : String(error),
      );
      process.exit(1);
    }
  }
}
