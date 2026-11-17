import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerArchitectureDefineCommand } from "./define/architecture.define.js";
import { registerArchitectureUpdateCommand } from "./update/architecture.update.js";
import { registerArchitectureViewCommand } from "./view/architecture.view.js";

/** Owns the `architecture` parent command and all leaves beneath it. */
export function registerArchitectureCommands(program: Command): void {
  const architecture = program
    .command("architecture")
    .description("Manage the deprecated project architecture aggregate");
  categorizeCommand(architecture, COMMAND_CATEGORY.solution);

  registerArchitectureDefineCommand(architecture);
  registerArchitectureUpdateCommand(architecture);
  registerArchitectureViewCommand(architecture);
}
