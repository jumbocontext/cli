import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerGoalAddCommand } from "./add/goal.add.js";
import { registerGoalUpdateCommand } from "./update/goal.update.js";
import { registerGoalShowCommand } from "./show/goal.show.js";
import { registerGoalBlockCommand } from "./block/goal.block.js";
import { registerGoalPostponeCommand } from "./postpone/goal.postpone.js";
import { registerGoalPauseCommand } from "./pause/goal.pause.js";
import { registerGoalRemoveCommand } from "./remove/goal.remove.js";
import { registerGoalResetCommand } from "./reset/goal.reset.js";
import { registerGoalUnblockCommand } from "./unblock/goal.unblock.js";
import { registerGoalReinstateCommand } from "./reinstate/goal.reinstate.js";
import { registerGoalRefineCommand } from "./refine/goal.refine.js";
import { registerGoalCommitCommand } from "./commit/goal.commit.js";
import { registerGoalSubmitCommand } from "./submit/goal.submit.js";
import { registerGoalCodifyCommand } from "./codify/goal.codify.js";
import { registerGoalCloseCommand } from "./close/goal.close.js";
import { registerGoalStartCommand } from "./start/goal.start.js";
import { registerGoalResumeCommand } from "./resume/goal.resume.js";
import { registerGoalReviewCommand } from "./review/goal.review.js";
import { registerGoalRejectCommand } from "./reject/goal.reject.js";
import { registerGoalApproveCommand } from "./approve/goal.approve.js";
import { registerGoalsListCommand } from "./list/goals.list.js";
import { registerGoalUpdateProgressCommand } from "./update-progress/goal.update-progress.js";

/** Owns the `goal` parent command and all leaves beneath it. */
export function registerGoalCommands(program: Command): void {
  const goal = program
    .command("goal")
    .description("Manage goal operations");
  categorizeCommand(goal, COMMAND_CATEGORY.work);

  registerGoalAddCommand(goal);
  registerGoalUpdateCommand(goal);
  registerGoalUpdateProgressCommand(goal);
  registerGoalShowCommand(goal);
  registerGoalBlockCommand(goal);
  registerGoalPostponeCommand(goal);
  registerGoalPauseCommand(goal);
  registerGoalRemoveCommand(goal);
  registerGoalResetCommand(goal);
  registerGoalUnblockCommand(goal);
  registerGoalReinstateCommand(goal);
  registerGoalRefineCommand(goal);
  registerGoalCommitCommand(goal);
  registerGoalSubmitCommand(goal);
  registerGoalCodifyCommand(goal);
  registerGoalCloseCommand(goal);
  registerGoalStartCommand(goal);
  registerGoalResumeCommand(goal);
  registerGoalReviewCommand(goal);
  registerGoalRejectCommand(goal);
  registerGoalApproveCommand(goal);

  const goals = program
    .command("goals")
    .description("List goal collections");
  categorizeCommand(goals, COMMAND_CATEGORY.work);

  registerGoalsListCommand(goals);
}
