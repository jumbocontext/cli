import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerDecisionAddCommand } from "./add/decision.add.js";
import { registerDecisionUpdateCommand } from "./update/decision.update.js";
import { registerDecisionRemoveCommand } from "./remove/decision.remove.js";
import { registerDecisionRestoreCommand } from "./restore/decision.restore.js";
import { registerDecisionReverseCommand } from "./reverse/decision.reverse.js";
import { registerDecisionShowCommand } from "./show/decision.show.js";
import { registerDecisionSupersedeCommand } from "./supersede/decision.supersede.js";
import { registerDecisionsListCommand } from "./list/decisions.list.js";
import { registerDecisionsSearchCommand } from "./search/decisions.search.js";

/** Owns the `decision` and `decisions` parent commands and all leaves beneath them. */
export function registerDecisionCommands(program: Command): void {
  const decision = program
    .command("decision")
    .description("Manage architectural decision records");
  categorizeCommand(decision, COMMAND_CATEGORY.solution);

  registerDecisionAddCommand(decision);
  registerDecisionUpdateCommand(decision);
  registerDecisionRemoveCommand(decision);
  registerDecisionRestoreCommand(decision);
  registerDecisionReverseCommand(decision);
  registerDecisionShowCommand(decision);
  registerDecisionSupersedeCommand(decision);

  const decisions = program
    .command("decisions")
    .description("List and search architectural decisions");
  categorizeCommand(decisions, COMMAND_CATEGORY.solution);

  registerDecisionsListCommand(decisions);
  registerDecisionsSearchCommand(decisions);
}
