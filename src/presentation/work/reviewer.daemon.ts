#!/usr/bin/env node

import { PollingLoop } from "../../application/daemons/PollingLoop.js";
import { ReviewerProcessManager } from "../../application/context/goals/review/ReviewerProcessManager.js";
import { AgentCliGateway } from "../../infrastructure/agents/AgentCliGateway.js";
import { IntervalTicker } from "../../infrastructure/daemons/IntervalTicker.js";
import { ProcessSignalSource } from "../../infrastructure/daemons/ProcessSignalSource.js";
import type { ProcessManagerEvent } from "../../application/daemons/IProcessManager.js";
import { LeafContainerBuilder } from "../../infrastructure/host/LeafContainerBuilder.js";
import type { IGoalStatusReader } from "../../application/context/goals/IGoalStatusReader.js";
import type { IGoalReader } from "../../application/context/goals/start/IGoalReader.js";
import type { GoalClaimPolicy } from "../../application/context/goals/claims/GoalClaimPolicy.js";
import type { IWorkerIdentityReader } from "../../application/host/workers/IWorkerIdentityReader.js";
import type { ITelemetryClient } from "../../application/telemetry/ITelemetryClient.js";
import { ensureDaemonHostSessionKey } from "../../infrastructure/host/session/DaemonHostSessionKey.js";

const DEFAULT_AGENT_ID = "codex";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_POLL_INTERVAL_MS = 30_000;
const FAILURE_EXIT_CODE = 1;
const DAEMON_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;

/** The services the reviewer daemon consumes; nothing more is composed. */
interface ReviewerDaemonDependencies {
  readonly goalStatusReader: IGoalStatusReader;
  readonly goalContextReader: IGoalReader;
  readonly goalClaimPolicy: GoalClaimPolicy;
  readonly workerIdentityReader: IWorkerIdentityReader;
  readonly telemetryClient: ITelemetryClient;
}

interface ReviewerDaemonComposition {
  readonly dependencies: ReviewerDaemonDependencies;
  dispose(): Promise<void>;
}

/** Composes exactly the reviewer daemon's services and tracks what it created. */
async function createReviewerDaemonDependencies(): Promise<ReviewerDaemonComposition> {
  const builder = new LeafContainerBuilder()
    .withGoalStatusReaderFeature()
    .withGoalContextReaderFeature()
    .withGoalClaimPolicyFeature()
    .withWorkerIdentityReaderFeature()
    .withTelemetryClientFeature();
  try {
    return {
      dependencies: await builder.build(),
      dispose: () => builder.dispose(),
    };
  } catch (error) {
    await builder.dispose();
    throw error;
  }
}

export async function runReviewerDaemon(argv = process.argv): Promise<void> {
  ensureDaemonHostSessionKey();
  const agentId = readOption(argv, "--agent") ?? DEFAULT_AGENT_ID;
  const maxRetries = readPositiveInt(
    argv,
    "--max-retries",
    DEFAULT_MAX_RETRIES,
  );
  const pollIntervalMs = readPositiveInt(
    argv,
    "--poll-interval-ms",
    DEFAULT_POLL_INTERVAL_MS,
  );
  const composition = await createReviewerDaemonDependencies();
  try {
    const dependencies = composition.dependencies;
    const manager = new ReviewerProcessManager(
      dependencies.goalStatusReader,
      dependencies.goalContextReader,
      dependencies.goalClaimPolicy,
      dependencies.workerIdentityReader,
      new AgentCliGateway(dependencies.telemetryClient),
      dependencies.telemetryClient,
    );

    await new PollingLoop().run({
      processManager: manager,
      processOptions: {
        agentId,
        maxRetries,
        emit: writeDaemonEvent,
      },
      ticker: new IntervalTicker(pollIntervalMs),
      shutdownSignal: new ProcessSignalSource(),
    });
  } finally {
    await composition.dispose();
  }
}

function readOption(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

function readPositiveInt(
  argv: string[],
  name: string,
  fallback: number,
): number {
  const parsed = Number.parseInt(readOption(argv, name) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function writeDaemonEvent(event: ProcessManagerEvent): void {
  process.stdout.write(`${JSON.stringify(boundDaemonEvent(event))}\n`);
}

function boundDaemonEvent(event: ProcessManagerEvent): ProcessManagerEvent {
  return {
    ...event,
    daemon: limitTextTail(event.daemon, DAEMON_EVENT_TEXT_FIELD_MAX_LENGTH),
    source: boundOptionalText(event.source),
    category: boundOptionalText(event.category),
    message: boundOptionalText(event.message),
    goalId: boundOptionalText(event.goalId),
    errorType: boundOptionalText(event.errorType),
    errorMessage: boundOptionalText(event.errorMessage),
  };
}

function boundOptionalText(value: string | undefined): string | undefined {
  return value === undefined
    ? undefined
    : limitTextTail(value, DAEMON_EVENT_TEXT_FIELD_MAX_LENGTH);
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}

if (process.argv[1]?.endsWith("reviewer.daemon.js")) {
  runReviewerDaemon().catch((error) => {
    writeDaemonEvent({
      daemon: "reviewer",
      status: "failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    process.exit(FAILURE_EXIT_CODE);
  });
}
