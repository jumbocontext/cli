import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerIndexRebuildCommand } from "./rebuild/index.rebuild.js";

/** Owns the `index` parent command and all leaves beneath it. */
export function registerIndexCommands(index: Command): void {
  categorizeCommand(index, COMMAND_CATEGORY.projectKnowledge);

  registerIndexRebuildCommand(index);
}
