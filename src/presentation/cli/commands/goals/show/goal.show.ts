/**
 * CLI Command: jumbo goal show
 *
 * Displays full goal details including objective, status, success criteria,
 * scope, and notes.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ShowGoalController } from "../../../../../application/context/goals/get/ShowGoalController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";
import { GoalShowOutputBuilder } from "./GoalShowOutputBuilder.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo goal show --id abc123",
    description: "Show complete goal details",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal add", "goal start", "goal update", "goal complete"];

/**
 * The abstract ports the `goal show` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalShowDependencies {
  readonly showGoalController: ShowGoalController;
}

/**
 * Composes exactly the feature the `goal show` leaf uses.
 */
async function createGoalShowDependencies(): Promise<GoalShowDependencies> {
  return new LeafContainerBuilder().withShowGoalFeature().build();
}

/** Registers the `goal show` leaf under the parent supplied by its group. */
export function registerGoalShowCommand(goal: Command): void {
  const command = goal
    .command("show")
    .description("Display full goal details")
    .requiredOption("-i, --id <id>", "ID of the goal to show");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal show",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalShowDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalShowDependencies();
  });

  command.action(async (options: { id: string }) => {
    if (!dependencies) throw new Error("Goal show dependencies were not initialized.");
    await goalShow(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalShow(
  options: { id: string },
  container: GoalShowDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Execute via controller — returns typed response
    const { contextualGoalView } = await container.showGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    // Preserve TTY vs pipe behavior: formatted text for humans, JSON for machines
    const outputBuilder = new GoalShowOutputBuilder();
    if (process.stdout.isTTY) {
      const output = outputBuilder.build(contextualGoalView);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(contextualGoalView);
      // For non-TTY (pipes/redirects), extract data and output as JSON
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) {
        renderer.data(dataSection.content as Record<string, unknown>);
      }
    }
  } catch (error) {
    const outputBuilder = new GoalShowOutputBuilder();

    // Handle goal not found case
    if (error instanceof Error && error.message.includes("Goal not found")) {
      const output = outputBuilder.buildGoalNotFoundError(options.id);
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    // Handle other errors
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
