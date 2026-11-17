import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerProjectInitCommand } from "./init/project.init.js";
import { registerProjectShowCommand } from "./show/project.show.js";
import { registerProjectStatsCommand } from "./stats/project.stats.js";
import { registerProjectUpdateCommand } from "./update/project.update.js";

/** Owns the `project` parent command and all leaves beneath it. */
export function registerProjectCommands(program: Command): void {
  const project = program.command("project").description("Manage projects");
  categorizeCommand(project, COMMAND_CATEGORY.projectKnowledge);

  registerProjectInitCommand(project, program);
  registerProjectShowCommand(project);
  registerProjectStatsCommand(project);
  registerProjectUpdateCommand(project);
}
