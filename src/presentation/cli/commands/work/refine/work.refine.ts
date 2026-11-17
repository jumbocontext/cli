/**
 * CLI Command: jumbo work refine
 *
 * Long-running daemon that continuously polls for goals in 'defined' state
 * and delegates their refinement to an agent subprocess. Runs until killed.
 *
 * Every interaction with Jumbo state is a short-lived subprocess.
 * This command holds no database connections or application infrastructure.
 */

import { execSync } from "node:child_process";
import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import { WORK_DAEMON_DEFAULTS } from "../shared/WorkDaemonDefaults.js";
import { RefineryDisplay } from "./RefineryDisplay.js";
import {
  SUPPORTED_AGENTS,
  AgentId,
  spawnAgent,
} from "../shared/AgentSpawner.js";
import { queryGoalStatus } from "../shared/GoalStatusQuery.js";
import { runDaemonLoop } from "../shared/DaemonLoop.js";
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
    command: "jumbo work refine --agent claude",
    description: "Start the refinery daemon using Claude",
  },
  {
    command: "jumbo work refine --agent claude --poll-interval 60",
    description: "Poll every 60 seconds instead of the default 30",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = ["goal refine", "work pause", "work resume"];

interface WorkRefineOptions {
  readonly agent: string;
  readonly pollInterval?: string;
  readonly maxRetries?: string;
}

// --- Refine-specific subprocess helpers ---

function queryDefinedGoals(): {
  goalId: string;
  objective: string;
  createdAt: string;
}[] {
  try {
    const stdout = execSync("npx jumbo goals list --status defined", {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 30_000,
    }).toString();
    const parsed = JSON.parse(stdout);
    const goals = (parsed.goals ?? []) as {
      goalId: string;
      objective: string;
      createdAt: string;
    }[];
    return goals.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

// --- Main daemon entry ---

/** Registers the `work refine` leaf under the parent supplied by its group. */
export function registerWorkRefineCommand(work: Command): void {
  const command = work
    .command("refine")
    .description(
      "Continuously refine defined goals via an agent subprocess (runs until killed)",
    )
    .requiredOption(
      "--agent <agentId>",
      `Agent to delegate refinement to (${SUPPORTED_AGENTS.join(", ")})`,
    )
    .option(
      "--poll-interval <seconds>",
      "Seconds to wait between polling for new goals",
      WORK_DAEMON_DEFAULTS.POLL_INTERVAL_S.toString(),
    )
    .option(
      "--max-retries <number>",
      "Max retry attempts per goal before moving on",
      WORK_DAEMON_DEFAULTS.MAX_RETRIES.toString(),
    );

  command.helpInformation = () =>
    formatSubcommandHelp({
      path: "work refine",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  // The daemon holds no application infrastructure; no preAction container.
  command.action(async (options) => {
    await workRefine(options as WorkRefineOptions);
  });
}

export async function workRefine(options: WorkRefineOptions) {
  const agentId = options.agent as AgentId;
  if (!SUPPORTED_AGENTS.includes(agentId)) {
    const display = new RefineryDisplay({
      agentId,
      pollIntervalS: 0,
      maxRetries: 0,
    });
    display.renderUnknownAgent(options.agent, SUPPORTED_AGENTS);
    process.exit(1);
  }

  const pollIntervalS =
    parseInt(options.pollInterval ?? "", 10) ||
    WORK_DAEMON_DEFAULTS.POLL_INTERVAL_S;
  const maxRetries =
    parseInt(options.maxRetries ?? "", 10) || WORK_DAEMON_DEFAULTS.MAX_RETRIES;

  const display = new RefineryDisplay({
    agentId,
    pollIntervalS,
    maxRetries,
  });

  await runDaemonLoop({ agentId, pollIntervalS, maxRetries }, display, {
    queryGoals: () => queryDefinedGoals(),
    spawnAgent: (goalId) => {
      const prompt = `Run the Jumbo refinement workflow for goal ${goalId}. Execute: jumbo goal refine --id ${goalId}`;
      return spawnAgent(agentId, prompt);
    },
    isGoalComplete: (goalId) => queryGoalStatus(goalId) === "refined",
    onGoalComplete: (goalId, objective, attempts) => {
      display.renderGoalComplete(goalId, objective, attempts);
    },
    onGoalSkipped: (goalId, _status, retries) => {
      const status = queryGoalStatus(goalId);
      display.renderGoalSkipped(goalId, status, retries);
    },
  });
}
