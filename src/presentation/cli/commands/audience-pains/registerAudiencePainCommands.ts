import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerAudiencePainAddCommand } from "./add/audiencePain.add.js";
import { registerAudiencePainUpdateCommand } from "./update/audiencePain.update.js";
import { registerAudiencePainsListCommand } from "./list/audiencePains.list.js";

/** Owns the `audiencePain` and `audiencePains` parent commands and all leaves beneath them. */
export function registerAudiencePainCommands(program: Command): void {
  const audiencePain = program
    .command("audiencePain")
    .description("Manage audience pain points");
  categorizeCommand(audiencePain, COMMAND_CATEGORY.projectKnowledge);

  registerAudiencePainAddCommand(audiencePain);
  registerAudiencePainUpdateCommand(audiencePain);

  const audiencePains = program
    .command("audiencePains")
    .description("List audience pain point collections");
  categorizeCommand(audiencePains, COMMAND_CATEGORY.projectKnowledge);

  registerAudiencePainsListCommand(audiencePains);
}
