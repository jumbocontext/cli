import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerInvariantAddCommand } from "./add/invariant.add.js";
import { registerInvariantUpdateCommand } from "./update/invariant.update.js";
import { registerInvariantRemoveCommand } from "./remove/invariant.remove.js";
import { registerInvariantsListCommand } from "./list/invariants.list.js";
import { registerInvariantsSearchCommand } from "./search/invariants.search.js";

/** Owns the `invariant` and `invariants` parent commands and all leaves beneath them. */
export function registerInvariantCommands(program: Command): void {
  const invariant = program
    .command("invariant")
    .description("Manage project invariants");
  categorizeCommand(invariant, COMMAND_CATEGORY.solution);

  registerInvariantAddCommand(invariant);
  registerInvariantUpdateCommand(invariant);
  registerInvariantRemoveCommand(invariant);

  const invariants = program
    .command("invariants")
    .description("List and search project invariants");
  categorizeCommand(invariants, COMMAND_CATEGORY.solution);

  registerInvariantsListCommand(invariants);
  registerInvariantsSearchCommand(invariants);
}
