import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerGuidelineAddCommand } from "./add/guideline.add.js";
import { registerGuidelineUpdateCommand } from "./update/guideline.update.js";
import { registerGuidelineRemoveCommand } from "./remove/guideline.remove.js";
import { registerGuidelineShowCommand } from "./show/guideline.show.js";
import { registerGuidelinesListCommand } from "./list/guidelines.list.js";
import { registerGuidelinesSearchCommand } from "./search/guidelines.search.js";

/** Owns the `guideline` and `guidelines` parent commands and all leaves beneath them. */
export function registerGuidelineCommands(program: Command): void {
  const guideline = program
    .command("guideline")
    .description("Manage execution guidelines");
  categorizeCommand(guideline, COMMAND_CATEGORY.solution);

  registerGuidelineAddCommand(guideline);
  registerGuidelineUpdateCommand(guideline);
  registerGuidelineRemoveCommand(guideline);
  registerGuidelineShowCommand(guideline);

  const guidelines = program
    .command("guidelines")
    .description("List and search execution guidelines");
  categorizeCommand(guidelines, COMMAND_CATEGORY.solution);

  registerGuidelinesListCommand(guidelines);
  registerGuidelinesSearchCommand(guidelines);
}
