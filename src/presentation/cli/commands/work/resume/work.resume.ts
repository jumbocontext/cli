/**
 * CLI Command: jumbo work resume
 *
 * Resumes the current worker's paused goal (transitions status from 'paused' to 'doing').
 * This is a parameterless command that automatically identifies the worker's paused goal.
 * Returns session orientation context with resume-specific LLM instructions.
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { ResumeWorkController } from "../../../../../application/context/work/resume/ResumeWorkController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ResumeWorkResponse } from "../../../../../application/context/work/resume/ResumeWorkResponse.js";
import { SessionStartTextRenderer } from "../../sessions/start/SessionStartTextRenderer.js";
import { EnrichedSessionContext } from "../../../../../application/context/sessions/get/EnrichedSessionContext.js";
import { GoalStartOutputBuilder } from "../../goals/start/GoalStartOutputBuilder.js";
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
    command: "jumbo work resume",
    description: "Resume your paused goal and get context",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["work pause", "goal resume", "goal start"];

/**
 * The abstract ports the `work resume` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
interface WorkResumeDependencies {
  readonly resumeWorkController: ResumeWorkController;
}

/**
 * Composes exactly the features the `work resume` leaf uses.
 */
async function createWorkResumeDependencies(): Promise<WorkResumeDependencies> {
  return new LeafContainerBuilder().withResumeWorkFeature().build();
}

/** Registers the `work resume` leaf under the parent supplied by its group. */
export function registerWorkResumeCommand(work: Command): void {
  const command = work
    .command("resume")
    .description("Resume the current worker's paused goal");

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "work resume",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: WorkResumeDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createWorkResumeDependencies();
  });

  command.action(async () => {
    if (!dependencies)
      throw new Error("Work resume dependencies were not initialized.");
    await workResume(dependencies);
  });
}

/**
 * Command handler
 * Called by Commander once the leaf container is composed
 *
 * Responsibilities (presentation layer only):
 * - Execute resume controller (which orchestrates goal resume + session context)
 * - Render session context for display
 * - Map resume-specific instruction signals to LLM text
 */
export async function workResume(container: WorkResumeDependencies) {
  const renderer = Renderer.getInstance();

  try {
    const config = renderer.getConfig();
    const isTextOutput = config.format === "text";

    if (isTextOutput) {
      renderer.info("Loading orientation context...\n");
    }

    // 1. CONTROLLER: Resume work and get enriched session context
    const result = await container.resumeWorkController.handle({});

    // 2. RENDER: Display session context
    if (isTextOutput) {
      const textRenderer = new SessionStartTextRenderer();
      const textOutput = textRenderer.render(result.context);
      const goalStartOutputBuilder = new GoalStartOutputBuilder();
      const goalInstructions = goalStartOutputBuilder
        .build(result.goalContextView)
        .toHumanReadable();

      for (const block of textOutput.blocks) {
        if (block) {
          renderer.info(block);
        }
      }

      renderer.info("---\n");
      renderer.info(renderResumeInstruction(result.context));
      renderer.info(goalInstructions);
    }

    // 3. OUTPUT: Render success
    if (isTextOutput) {
      renderer.success("Work resumed", {
        goalId: result.goalId,
        objective: result.objective,
        status: "doing",
      });
    } else {
      renderer.data(buildStructuredResumeOutput(result));
    }
  } catch (error) {
    // Check if this is a "no paused goal" scenario (not an error for hooks)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNoPausedGoal = errorMessage.includes("No paused goal found");

    if (isNoPausedGoal) {
      // Not an error - just no paused work. Exit cleanly for hooks.
      renderer.info("No paused goal to resume");
    } else {
      // Actual error - render error and fail
      renderer.error(
        "Failed to resume work",
        error instanceof Error ? error : String(error),
      );
      process.exit(1);
    }
  }
}

/**
 * Maps resume instruction signals to LLM-facing text.
 * Presentation layer owns copy; application layer owns instruction signals.
 */
function renderResumeInstruction(
  sessionContext: EnrichedSessionContext,
): string {
  const lines: string[] = [];

  if (sessionContext.instructions.includes("resume-continuation-prompt")) {
    lines.push(
      "@LLM: Your work was previously interrupted. Continue working on the resumed goal.",
      "Determine where you left off based on the registered progress and resume from there.",
      "Register completed sub-tasks via 'jumbo goal update-progress --help'.",
    );
  }

  if (sessionContext.instructions.includes("paused-goals-context")) {
    lines.push(
      "IMPORTANT: There are paused goals. Run 'jumbo goal resume --id <id>' to resume a specific goal.",
    );
  }

  return lines.join("\n") + "\n";
}

function buildStructuredResumeOutput(result: ResumeWorkResponse) {
  const textRenderer = new SessionStartTextRenderer();
  const structuredContext = textRenderer.buildStructuredContext(result.context);

  return {
    ...structuredContext,
    llmInstructions: {
      ...structuredContext.llmInstructions,
      workResume: renderResumeInstruction(result.context).trim(),
    },
    workResume: {
      goalId: result.goalId,
      objective: result.objective,
      status: "doing",
    },
    resumedGoalContext: result.goalContextView,
  };
}
