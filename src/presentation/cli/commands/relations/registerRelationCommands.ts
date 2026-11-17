import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerRelationAddCommand } from "./add/relation.add.js";
import { registerRelationRemoveCommand } from "./remove/relation.remove.js";
import { registerRelationsListCommand } from "./list/relations.list.js";
import { registerRelationsAuditCommand } from "./audit/relations.audit.js";
import { registerRelationsPathCommand } from "./path/relations.path.js";
import { registerRelationsTraverseCommand } from "./traverse/relations.traverse.js";

/** Owns the `relation` and `relations` parent commands and all leaves beneath them. */
export function registerRelationCommands(program: Command): void {
  const relation = program
    .command("relation")
    .description("Manage individual knowledge graph relations");
  categorizeCommand(relation, COMMAND_CATEGORY.relations);

  registerRelationAddCommand(relation);
  registerRelationRemoveCommand(relation);

  const relations = program
    .command("relations")
    .description("Query knowledge graph relations");
  categorizeCommand(relations, COMMAND_CATEGORY.relations);

  registerRelationsListCommand(relations);
  registerRelationsAuditCommand(relations);
  registerRelationsPathCommand(relations);
  registerRelationsTraverseCommand(relations);
}
