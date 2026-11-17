/**
 * CLI Command: jumbo goal resume
 *
 * Resumes work on a goal by loading its full context.
 * If the goal is 'paused', transitions it to 'doing' status.
 * If the goal is already 'doing', just reloads context (idempotent).
 *
 * Usage:
 *   jumbo goal resume --id <goalId> [--note "..."]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ResumeGoalController } from "../../../../../application/context/goals/resume/ResumeGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalResumeOutputBuilder } from "./GoalResumeOutputBuilder.js";
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
    command: "jumbo goal resume --id abc123",
    description: "Resume working on a paused or in-progress goal",
  },
  {
    command: 'jumbo goal resume --id abc123 --note "Ready to continue"',
    description: "Resume a paused goal with a note",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal pause", "goal start", "goal complete"];

/**
 * The abstract ports the `goal resume` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalResumeDependencies {
  readonly resumeGoalController: ResumeGoalController;
}

/**
 * Composes exactly the features the `goal resume` leaf uses.
 */
async function createGoalResumeDependencies(): Promise<GoalResumeDependencies> {
  return new LeafContainerBuilder().withResumeGoalFeature().build();
}

/** Registers the `goal resume` leaf under the parent supplied by its group. */
export function registerGoalResumeCommand(goal: Command): void {
  const command = goal
    .command("resume")
    .description(
      "Resume work on a goal (transitions 'paused' to 'doing', or reloads context if already 'doing')",
    )
    .requiredOption("-i, --id <id>", "ID of the goal to resume")
    .option(
      "-N, --note <note>",
      "Optional note about resumption (only used when transitioning from 'paused')",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal resume",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalResumeDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalResumeDependencies();
  });

  command.action(async (options) => {
    if (!dependencies) {
      throw new Error("Goal resume dependencies were not initialized.");
    }
    await goalResume(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalResume(
  options: { id: string; note?: string },
  container: GoalResumeDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.resumeGoalController.handle({
      goalId: options.id,
      note: options.note,
    });

    // Build and render output using builder pattern
    const outputBuilder = new GoalResumeOutputBuilder();
    const output = outputBuilder.build(response.contextualGoalView);

    renderer.info(output.toHumanReadable());
  } catch (error) {
    renderer.error(
      "Failed to resume goal",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
}
