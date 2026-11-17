import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerComponentAddCommand } from "./add/component.add.js";
import { registerComponentUpdateCommand } from "./update/component.update.js";
import { registerComponentRemoveCommand } from "./remove/component.remove.js";
import { registerComponentRenameCommand } from "./rename/component.rename.js";
import { registerComponentShowCommand } from "./show/component.show.js";
import { registerComponentDeprecateCommand } from "./deprecate/component.deprecate.js";
import { registerComponentUndeprecateCommand } from "./undeprecate/component.undeprecate.js";
import { registerComponentsListCommand } from "./list/components.list.js";
import { registerComponentsSearchCommand } from "./search/components.search.js";

/** Owns the `component` and `components` parent commands and all leaves beneath them. */
export function registerComponentCommands(program: Command): void {
  const component = program
    .command("component")
    .description("Manage software components");
  categorizeCommand(component, COMMAND_CATEGORY.solution);

  registerComponentAddCommand(component);
  registerComponentUpdateCommand(component);
  registerComponentRemoveCommand(component);
  registerComponentRenameCommand(component);
  registerComponentShowCommand(component);
  registerComponentDeprecateCommand(component);
  registerComponentUndeprecateCommand(component);

  const components = program
    .command("components")
    .description("List and search software components");
  categorizeCommand(components, COMMAND_CATEGORY.solution);

  registerComponentsListCommand(components);
  registerComponentsSearchCommand(components);
}
