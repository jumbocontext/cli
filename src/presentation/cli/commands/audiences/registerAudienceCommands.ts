import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerAudienceAddCommand } from "./add/audience.add.js";
import { registerAudienceUpdateCommand } from "./update/audience.update.js";
import { registerAudienceRemoveCommand } from "./remove/audience.remove.js";
import { registerAudiencesListCommand } from "./list/audiences.list.js";

/** Owns the `audience` and `audiences` parent commands and all leaves beneath them. */
export function registerAudienceCommands(program: Command): void {
  const audience = program
    .command("audience")
    .description("Manage target audiences");
  categorizeCommand(audience, COMMAND_CATEGORY.projectKnowledge);

  registerAudienceAddCommand(audience);
  registerAudienceUpdateCommand(audience);
  registerAudienceRemoveCommand(audience);

  const audiences = program
    .command("audiences")
    .description("List target audience collections");
  categorizeCommand(audiences, COMMAND_CATEGORY.projectKnowledge);

  registerAudiencesListCommand(audiences);
}
