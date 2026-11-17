/**
 * CLI Command: jumbo work review
 *
 * Long-running daemon that continuously polls for goals in 'submitted' state
 * and delegates their QA review to an agent subprocess. Runs until killed.
 *
 * A goal is considered reviewed when its status transitions to either
 * 'approved' or 'rejected' — both are valid review outcomes.
 *
 * Every interaction with Jumbo state is a short-lived subprocess.
 * This command holds no database connections or application infrastructure.
 */

import { execSync } from "node:child_process";
import type { Command } from "commander";
import type { CommandExample } from "../../registry/CommandMetadata.js";
import { WORK_DAEMON_DEFAULTS } from "../shared/WorkDaemonDefaults.js";
import { ReviewerDisplay } from "./ReviewerDisplay.js";
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
    command: "jumbo work review --agent claude",
    description: "Start the reviewer daemon using Claude",
  },
  {
    command: "jumbo work review --agent claude --poll-interval 60",
    description: "Poll every 60 seconds instead of the default 30",
  },
];

/**
 * Examples and related commands are the only help copy this leaf owns;
 * flags, descriptions, and the command description derive from the
 * canonical registration chain via metadataFromCommand().
 */
const RELATED_COMMANDS = [
  "goal review",
  "goal approve",
  "goal reject",
  "work pause",
  "work resume",
];

const REVIEW_COMPLETE_STATUSES = ["approved", "rejected"] as const;

interface WorkReviewOptions {
  readonly agent: string;
  readonly pollInterval?: string;
  readonly maxRetries?: string;
}

// --- Review-specific subprocess helpers ---

function querySubmittedGoals(): {
  goalId: string;
  objective: string;
  createdAt: string;
}[] {
  try {
    const stdout = execSync("npx jumbo goals list --status submitted", {
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

function isReviewComplete(goalId: string): boolean {
  const status = queryGoalStatus(goalId);
  return (REVIEW_COMPLETE_STATUSES as readonly string[]).includes(status);
}

// --- Main daemon entry ---

/** Registers the `work review` leaf under the parent supplied by its group. */
export function registerWorkReviewCommand(work: Command): void {
  const command = work
    .command("review")
    .description(
      "Continuously review submitted goals via an agent subprocess (runs until killed)",
    )
    .requiredOption(
      "--agent <agentId>",
      `Agent to delegate review to (${SUPPORTED_AGENTS.join(", ")})`,
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
      path: "work review",
      metadata: metadataFromCommand(command, {
        category: COMMAND_CATEGORY.work,
        examples: EXAMPLES,
        related: RELATED_COMMANDS,
      }),
    });

  // The daemon holds no application infrastructure; no preAction container.
  command.action(async (options) => {
    await workReview(options as WorkReviewOptions);
  });
}

export async function workReview(options: WorkReviewOptions) {
  const agentId = options.agent as AgentId;
  if (!SUPPORTED_AGENTS.includes(agentId)) {
    const display = new ReviewerDisplay({
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

  const display = new ReviewerDisplay({
    agentId,
    pollIntervalS,
    maxRetries,
  });

  await runDaemonLoop({ agentId, pollIntervalS, maxRetries }, display, {
    queryGoals: () => querySubmittedGoals(),
    spawnAgent: (goalId) => {
      const prompt = `Run the Jumbo review workflow for goal ${goalId}. Execute: jumbo goal review --id ${goalId}`;
      return spawnAgent(agentId, prompt);
    },
    isGoalComplete: (goalId) => isReviewComplete(goalId),
    onGoalComplete: (goalId, objective, attempts) => {
      const outcome = queryGoalStatus(goalId);
      display.renderReviewOutcome(goalId, objective, attempts, outcome);
    },
    onGoalSkipped: (goalId, _status, retries) => {
      const status = queryGoalStatus(goalId);
      display.renderGoalSkipped(goalId, status, retries);
    },
  });
}
