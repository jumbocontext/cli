import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerDependencyAddCommand } from "./add/dependency.add.js";
import { registerDependencyUpdateCommand } from "./update/dependency.update.js";
import { registerDependencyRemoveCommand } from "./remove/dependency.remove.js";
import { registerDependenciesListCommand } from "./list/dependencies.list.js";
import { registerDependenciesSearchCommand } from "./search/dependencies.search.js";

/** Owns the `dependency` and `dependencies` parent commands and all leaves beneath them. */
export function registerDependencyCommands(program: Command): void {
  const dependency = program
    .command("dependency")
    .description("Manage third-party dependencies");
  categorizeCommand(dependency, COMMAND_CATEGORY.solution);

  registerDependencyAddCommand(dependency);
  registerDependencyUpdateCommand(dependency);
  registerDependencyRemoveCommand(dependency);

  const dependencies = program
    .command("dependencies")
    .description("List and search third-party dependencies");
  categorizeCommand(dependencies, COMMAND_CATEGORY.solution);

  registerDependenciesListCommand(dependencies);
  registerDependenciesSearchCommand(dependencies);
}
