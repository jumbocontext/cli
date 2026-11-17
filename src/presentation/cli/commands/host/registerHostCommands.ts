import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerWorkerViewCommand } from "./workers/worker.view.js";

/** Owns the `worker` parent command and all leaves beneath it. */
export function registerHostCommands(program: Command): void {
  const worker = program
    .command("worker")
    .description("Manage worker identity and claims");
  categorizeCommand(worker, COMMAND_CATEGORY.host);

  registerWorkerViewCommand(worker);
}
