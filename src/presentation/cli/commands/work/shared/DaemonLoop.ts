/**
 * Daemon Loop
 *
 * Generic polling daemon infrastructure for work commands.
 * Encapsulates the poll-process-sleep cycle, retry/exhaustion tracking
 * per goal, and graceful shutdown via SIGINT/SIGTERM/'q' keypress.
 */

import { DaemonDisplay } from "./DaemonDisplay.js";

export interface DaemonConfig {
  /** Agent identifier for display and spawning */
  readonly agentId: string;
  /** Seconds between polling cycles */
  readonly pollIntervalS: number;
  /** Max retry attempts per goal before marking exhausted */
  readonly maxRetries: number;
}

export interface GoalEntry {
  readonly goalId: string;
  readonly objective: string;
}

export interface DaemonCallbacks {
  /** Query for goals eligible for processing */
  queryGoals: () => GoalEntry[];
  /** Spawn the agent to process a goal; returns exit code */
  spawnAgent: (goalId: string) => Promise<number>;
  /** Check whether the goal reached the desired state */
  isGoalComplete: (goalId: string) => boolean;
  /** Called when a goal successfully completes */
  onGoalComplete: (goalId: string, objective: string, attempts: number) => void;
  /** Called when a goal is exhausted after max retries */
  onGoalSkipped: (goalId: string, status: string, maxRetries: number) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run the daemon polling loop.
 *
 * Polls for goals, processes them with retry logic, and handles
 * graceful shutdown. Returns when shutdown is triggered.
 */
export async function runDaemonLoop(
  config: DaemonConfig,
  display: DaemonDisplay,
  callbacks: DaemonCallbacks,
): Promise<void> {
  const pollIntervalMs = config.pollIntervalS * 1000;
  const exhaustedGoals = new Set<string>();

  let running = true;

  const shutdown = () => {
    running = false;
  };

  // Listen for 'q' keypress to stop gracefully
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (key: Buffer) => {
      const ch = key.toString();
      if (ch === "q" || ch === "Q" || ch === "\x03") {
        shutdown();
      }
    });
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await display.renderHeader();

  while (running) {
    const goals = callbacks
      .queryGoals()
      .filter((g) => !exhaustedGoals.has(g.goalId));

    if (goals.length === 0) {
      const spinner = display.startWaiting();
      const end = Date.now() + pollIntervalMs;
      while (running && Date.now() < end) {
        await sleep(250);
      }
      spinner.stop();
      continue;
    }

    const target = goals[0];

    let completed = false;
    for (let attempt = 1; attempt <= config.maxRetries && running; attempt++) {
      display.renderGoalStart(
        target.goalId,
        target.objective,
        attempt,
        config.maxRetries,
      );

      const spinner = display.startProcessing();
      await callbacks.spawnAgent(target.goalId);
      spinner.stop();

      if (!running) break;

      if (callbacks.isGoalComplete(target.goalId)) {
        callbacks.onGoalComplete(target.goalId, target.objective, attempt);
        completed = true;
        break;
      }

      if (attempt === config.maxRetries) {
        callbacks.onGoalSkipped(
          target.goalId,
          "not-complete",
          config.maxRetries,
        );
      }
    }

    if (!completed) {
      exhaustedGoals.add(target.goalId);
    }

    await sleep(2000);
  }

  // Clean up stdin and exit
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
  display.renderShutdown();
}
