import type { Command } from "commander";
import { categorizeCommand } from "../../help/CategoryFormatter.js";
import { COMMAND_CATEGORY } from "../../help/CommandCategories.js";
import { registerSessionStartCommand } from "./start/session.start.js";
import { registerSessionEndCommand } from "./end/session.end.js";
import { registerSessionCompactCommand } from "./compact/session.compact.js";
import { registerSessionsListCommand } from "./list/sessions.list.js";

/** Owns the `session` and `sessions` parent commands and all leaves beneath them. */
export function registerSessionCommands(program: Command): void {
  const session = program
    .command("session")
    .description("Manage working sessions");
  categorizeCommand(session, COMMAND_CATEGORY.work);

  registerSessionStartCommand(session);
  registerSessionEndCommand(session);
  registerSessionCompactCommand(session);

  const sessions = program
    .command("sessions")
    .description("List session collections");
  categorizeCommand(sessions, COMMAND_CATEGORY.work);

  registerSessionsListCommand(sessions);
}
