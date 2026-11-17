import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerValueAddCommand } from "./add/value.add.js";
import { registerValueUpdateCommand } from "./update/value.update.js";
import { registerValueRemoveCommand } from "./remove/value.remove.js";
import { registerValuesListCommand } from "./list/values.list.js";

/**
 * Owns the `value` and `values` parent commands and all leaves beneath them.
 */
export function registerValuePropositionCommands(program: Command): void {
  const value = program
    .command("value")
    .description("Manage value propositions");
  categorizeCommand(value, COMMAND_CATEGORY.projectKnowledge);

  registerValueAddCommand(value);
  registerValueUpdateCommand(value);
  registerValueRemoveCommand(value);

  const values = program
    .command("values")
    .description("List value proposition collections");
  categorizeCommand(values, COMMAND_CATEGORY.projectKnowledge);

  registerValuesListCommand(values);
}
