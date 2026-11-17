#!/usr/bin/env node

import { PollingLoop } from "../../application/daemons/PollingLoop.js";
import type { ProcessManagerEvent } from "../../application/daemons/IProcessManager.js";
import { AgentCliGateway } from "../../infrastructure/agents/AgentCliGateway.js";
import { IntervalTicker } from "../../infrastructure/daemons/IntervalTicker.js";
import { ProcessSignalSource } from "../../infrastructure/daemons/ProcessSignalSource.js";
import { CodifierProcessManager } from "../../application/context/goals/codify/CodifierProcessManager.js";
import { LeafContainerBuilder } from "../../infrastructure/host/LeafContainerBuilder.js";
import type { IGoalStatusReader } from "../../application/context/goals/IGoalStatusReader.js";
import type { IGoalCodifyingStartedProjector } from "../../application/context/goals/codify/IGoalCodifyingStartedProjector.js";
import type { IGoalCodifyReader } from "../../application/context/goals/codify/IGoalCodifyReader.js";
import type { GoalClaimPolicy } from "../../application/context/goals/claims/GoalClaimPolicy.js";
import type { IWorkerIdentityReader } from "../../application/host/workers/IWorkerIdentityReader.js";
import type { ITelemetryClient } from "../../application/telemetry/ITelemetryClient.js";
import { ensureDaemonHostSessionKey } from "../../infrastructure/host/session/DaemonHostSessionKey.js";

const DEFAULT_AGENT_ID = "codex";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_POLL_INTERVAL_MS = 30_000;
const FAILURE_EXIT_CODE = 1;
const DAEMON_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;

interface CodifierDaemonOptions {
  readonly agentId: string;
  readonly maxRetries: number;
  readonly pollIntervalMs: number;
}

/** The services the codifier daemon consumes; nothing more is composed. */
interface CodifierDaemonDependencies {
  readonly goalStatusReader: IGoalStatusReader;
  readonly goalCodifyingStartedProjector: IGoalCodifyingStartedProjector &
    IGoalCodifyReader;
  readonly goalClaimPolicy: GoalClaimPolicy;
  readonly workerIdentityReader: IWorkerIdentityReader;
  readonly telemetryClient: ITelemetryClient;
}

interface CodifierDaemonComposition {
  readonly dependencies: CodifierDaemonDependencies;
  dispose(): Promise<void>;
}

/** Composes exactly the codifier daemon's services and tracks what it created. */
async function createCodifierDaemonDependencies(): Promise<CodifierDaemonComposition> {
  const builder = new LeafContainerBuilder()
    .withGoalStatusReaderFeature()
    .withGoalCodifyingStartedProjectorFeature()
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

export async function runCodifierDaemon(argv = process.argv): Promise<void> {
  ensureDaemonHostSessionKey();
  const options = parseOptions(argv);
  const composition = await createCodifierDaemonDependencies();
  try {
    const dependencies = composition.dependencies;

    const manager = new CodifierProcessManager(
      dependencies.goalStatusReader,
      dependencies.goalCodifyingStartedProjector,
      dependencies.goalClaimPolicy,
      dependencies.workerIdentityReader,
      new AgentCliGateway(dependencies.telemetryClient),
      dependencies.telemetryClient,
    );

    await new PollingLoop().run({
      processManager: manager,
      processOptions: {
        agentId: options.agentId,
        maxRetries: options.maxRetries,
        emit: writeDaemonEvent,
      },
      ticker: new IntervalTicker(options.pollIntervalMs),
      shutdownSignal: new ProcessSignalSource(),
    });
  } finally {
    await composition.dispose();
  }
}

function parseOptions(argv: string[]): CodifierDaemonOptions {
  return {
    agentId: readOption(argv, "--agent") ?? DEFAULT_AGENT_ID,
    maxRetries: parsePositiveInt(
      readOption(argv, "--max-retries"),
      DEFAULT_MAX_RETRIES,
    ),
    pollIntervalMs: parsePositiveInt(
      readOption(argv, "--poll-interval-ms"),
      DEFAULT_POLL_INTERVAL_MS,
    ),
  };
}

function readOption(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return argv[index + 1];
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
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

if (process.argv[1]?.endsWith("codifier.daemon.js")) {
  runCodifierDaemon().catch((error) => {
    writeDaemonEvent({
      daemon: "codifier",
      status: "failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    process.exit(FAILURE_EXIT_CODE);
  });
}
