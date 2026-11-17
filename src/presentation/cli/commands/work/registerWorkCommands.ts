import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerWorkPauseCommand } from "./pause/work.pause.js";
import { registerWorkResumeCommand } from "./resume/work.resume.js";
import { registerWorkRefineCommand } from "./refine/work.refine.js";
import { registerWorkReviewCommand } from "./review/work.review.js";

/** Owns the `work` parent command and all leaves beneath it. */
export function registerWorkCommands(program: Command): void {
  const work = program
    .command("work")
    .description("Worker lifecycle operations for the current agent");
  categorizeCommand(work, COMMAND_CATEGORY.work);

  registerWorkPauseCommand(work);
  registerWorkResumeCommand(work);
  registerWorkRefineCommand(work);
  registerWorkReviewCommand(work);
}
