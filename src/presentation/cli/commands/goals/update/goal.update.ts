/**
 * CLI Command: jumbo goal update
 *
 * Updates properties of an existing goal.
 * Only provided fields are updated; omitted fields remain unchanged.
 *
 * Usage:
 *   jumbo goal update --id <id> [--title "..."] [--objective "..."] [--criteria "..."] [--scope-in "..."] [--scope-out "..."]
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { UpdateGoalController } from "../../../../../application/context/goals/update/UpdateGoalController.js";
import { UpdateGoalRequest } from "../../../../../application/context/goals/update/UpdateGoalRequest.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalUpdateOutputBuilder } from "./GoalUpdateOutputBuilder.js";
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
    command: 'jumbo goal update --id abc123 --title "New Title"',
    description: "Update a goal's title only",
  },
  {
    command: 'jumbo goal update --id abc123 --objective "Updated goal"',
    description: "Update a goal's objective only",
  },
  {
    command:
      'jumbo goal update --id abc123 --criteria "Criterion 1" "Criterion 2"',
    description: "Update success criteria only",
  },
  {
    command:
      'jumbo goal update --id abc123 --objective "New objective" --scope-in "Component A"',
    description: "Update multiple fields at once",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal add", "goal start", "goal complete"];

/**
 * The abstract ports the `goal update` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface GoalUpdateDependencies {
  readonly updateGoalController: UpdateGoalController;
}

/**
 * Composes exactly the features the `goal update` leaf uses.
 */
async function createGoalUpdateDependencies(): Promise<GoalUpdateDependencies> {
  return new LeafContainerBuilder().withUpdateGoalFeature().build();
}

/** Registers the `goal update` leaf under the parent supplied by its group. */
export function registerGoalUpdateCommand(goal: Command): void {
  const command = goal
    .command("update")
    .description(
      "Update an existing goal's properties (partial updates supported)",
    )
    .requiredOption("-i, --id <id>", "ID of the goal to update")
    .option("-t, --title <text>", "Updated title (max 60 characters)")
    .option("--objective <text>", "Updated objective")
    .option(
      "--criteria <items...>",
      "Updated success criteria (can specify multiple)",
    )
    .option("--scope-in <items...>", "Updated in-scope items")
    .option("--scope-out <items...>", "Updated out-of-scope items")
    .option(
      "--next-goal <goalId>",
      "Update the NextGoal property (chains to specified goal after completion)",
    )
    .option(
      "--prerequisite-goals <goalIds...>",
      "Update prerequisite goal IDs that must be completed before this goal can start",
    )
    .option(
      "--branch <branch>",
      "Update the git branch for this goal (for multi-agent collaboration)",
    )
    .option(
      "--worktree <worktree>",
      "Update the git worktree path for this goal (for multi-agent collaboration)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "goal update",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: GoalUpdateDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createGoalUpdateDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Goal update dependencies were not initialized.");
    await goalUpdate(options, dependencies);
  });
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalUpdate(
  options: {
    id: string;
    title?: string;
    objective?: string;
    criteria?: string[];
    scopeIn?: string[];
    scopeOut?: string[];
    nextGoal?: string;
    prerequisiteGoals?: string[];
    branch?: string;
    worktree?: string;
  },
  container: GoalUpdateDependencies,
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalUpdateOutputBuilder();

  try {
    const request: UpdateGoalRequest = {
      goalId: options.id,
      title: options.title,
      objective: options.objective,
      successCriteria: options.criteria,
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      nextGoalId: options.nextGoal,
      prerequisiteGoals: options.prerequisiteGoals,
      branch: options.branch,
      worktree: options.worktree,
    };

    const response = await container.updateGoalController.handle(request);

    // Build and render success output
    const output = outputBuilder.buildSuccess(response.goalId);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
