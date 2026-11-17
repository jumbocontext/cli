/**
 * CLI Command: jumbo sessions list
 *
 * Lists session history with optional status filtering.
 *
 * Usage:
 *   jumbo sessions list
 *   jumbo sessions list --status active
 *   jumbo sessions list --status ended --format json
 */

import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import type { GetSessionsController } from "../../../../../application/context/sessions/get/GetSessionsController.js";
import { LeafContainerBuilder } from "../../../../../infrastructure/host/LeafContainerBuilder.js";
import { SessionStatusFilter } from "../../../../../application/context/sessions/get/ISessionViewReader.js";
import { GetSessionsRequest } from "../../../../../application/context/sessions/get/GetSessionsRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { SessionListOutputBuilder } from "./SessionListOutputBuilder.js";
import {
  formatSubcommandHelp,
  metadataFromCommand,
} from "../../../help/SubcommandHelpFormatter.js";
import { COMMAND_CATEGORY } from "../../../help/CommandCategories.js";

/**
 * Help copy owned by this leaf, shown in the EXAMPLES section of `--help`.
 */
const EXAMPLES: CommandExample[] = [
  {
    command: "jumbo sessions list",
    description: "List all sessions",
  },
  {
    command: "jumbo sessions list --status active",
    description: "List only active sessions",
  },
  {
    command: "jumbo sessions list --status ended --format json",
    description: "List ended sessions as JSON",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["session start", "session end"];

/**
 * The abstract ports the `sessions list` leaf requires. Satisfied structurally
 * by the LeafContainerBuilder composition below; a missing `with*Feature()`
 * call fails to compile here, at the leaf that made the demand.
 */
export interface SessionsListDependencies {
  readonly getSessionsController: GetSessionsController;
}

/**
 * Composes exactly the features the `sessions list` leaf uses.
 */
async function createSessionsListDependencies(): Promise<SessionsListDependencies> {
  return new LeafContainerBuilder().withGetSessionsFeature().build();
}

/** Registers the `sessions list` leaf under the parent supplied by its group. */
export function registerSessionsListCommand(sessions: Command): void {
  const command = sessions
    .command("list")
    .description("List session history")
    .option(
      "-s, --status <status>",
      "Filter by status: active, paused, ended, or all (default: all)",
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "sessions list",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  let dependencies: SessionsListDependencies | undefined;

  command.hook("preAction", async () => {
    dependencies = await createSessionsListDependencies();
  });

  command.action(async (options) => {
    if (!dependencies)
      throw new Error("Sessions list dependencies were not initialized.");
    await sessionsList(options, dependencies);
  });
}

/**
 * Validate status filter
 */
function isValidStatus(status: string): status is SessionStatusFilter {
  return ["active", "paused", "ended", "all"].includes(status);
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionsList(
  options: { status?: string },
  container: SessionsListDependencies,
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate and normalize status filter
    const statusFilter = options.status || "all";
    if (!isValidStatus(statusFilter)) {
      renderer.error(
        `Invalid status: ${statusFilter}. Must be one of: active, paused, ended, all`,
      );
      process.exit(1);
    }

    const request: GetSessionsRequest = { status: statusFilter };
    const { sessions } = await container.getSessionsController.handle(request);

    if (sessions.length === 0) {
      const filterMsg =
        statusFilter === "all" ? "" : ` with status '${statusFilter}'`;
      renderer.info(
        `No sessions found${filterMsg}. Use 'jumbo session start' to begin a session.`,
      );
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();
    const outputBuilder = new SessionListOutputBuilder();

    if (config.format === "text") {
      const output = outputBuilder.build(sessions, statusFilter);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(
        sessions,
        statusFilter,
      );
      const sections = output.getSections();
      const dataSection = sections.find((s) => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error(
      "Failed to list sessions",
      error instanceof Error ? error : String(error),
    );
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
