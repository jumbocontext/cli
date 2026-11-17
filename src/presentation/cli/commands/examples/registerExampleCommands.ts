import type { Command } from "commander";
import { registerExampleAddCommand } from "./add/example.add.js";
import { registerExampleUpdateCommand } from "./update/example.update.js";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORIES } from "../../help/CommandCategories.js";

/** Owns the `example` parent command and all leaves beneath it. */
export function registerExampleCommands(program: Command): void {
  const example = program
    .command("example")
    .description("Example commands demonstrating CLI registration conventions");

  categorizeCommand(example, COMMAND_CATEGORIES[0]);

  registerExampleAddCommand(example);
  registerExampleUpdateCommand(example);
}
