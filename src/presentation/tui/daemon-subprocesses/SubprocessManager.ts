import type { ILogger } from "../../../application/logging/ILogger.js";
import type {
  IWorkerDaemonProcessController,
  WorkerDaemonTerminationResult,
} from "../../../application/daemons/IWorkerDaemonProcessController.js";
import { WORKER_DAEMON_NAMES } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type { ISubprocessManager } from "./ISubprocessManager.js";
import type { ManagedSubprocess } from "./ManagedSubprocess.js";
import type { DaemonConfig } from "./DaemonConfig.js";
import type { DaemonName } from "./DaemonName.js";
import type { SubprocessSnapshot } from "./SubprocessSnapshot.js";
import { DaemonOutputEventParser } from "./DaemonOutputEventParser.js";
import { SubprocessConfigResolver } from "./SubprocessConfigResolver.js";
import {
  SubprocessStatus,
  type SubprocessStatusValue,
} from "./SubprocessStatus.js";
import { SubprocessCopy } from "./SubprocessCopy.js";
import { SubprocessLifecycleEventRecorder } from "./SubprocessLifecycleEventRecorder.js";
import { SubprocessNoOpLogger } from "./SubprocessNoOpLogger.js";
import { SubprocessOutputRingBuffer } from "./SubprocessOutputRingBuffer.js";
import { SubprocessSnapshotMapper } from "./SubprocessSnapshotMapper.js";

const DAEMON_HEARTBEAT_INTERVAL_MS = 5_000;

export class SubprocessManager implements ISubprocessManager {
  private readonly processes = new Map<DaemonName, ManagedSubprocess>();
  private readonly configResolver = new SubprocessConfigResolver();
  private readonly outputRingBuffer = new SubprocessOutputRingBuffer();
  private readonly outputEventParser = new DaemonOutputEventParser();
  private readonly snapshotMapper = new SubprocessSnapshotMapper();
  private readonly lifecycleEventRecorder: SubprocessLifecycleEventRecorder;

  constructor(
    private readonly processController: IWorkerDaemonProcessController,
    private readonly logger: ILogger = SubprocessNoOpLogger,
  ) {
    this.lifecycleEventRecorder = new SubprocessLifecycleEventRecorder(
      logger,
      this.outputEventParser,
    );
  }

  async spawn(
    name: DaemonName,
    config: Partial<DaemonConfig> = {},
  ): Promise<SubprocessSnapshot> {
    const existing = this.processes.get(name);
    if (
      existing?.status === SubprocessStatus.RUNNING ||
      existing?.status === SubprocessStatus.STOPPING
    ) {
      return this.snapshotMapper.fromManagedSubprocess(existing);
    }

    const resolvedConfig = this.configResolver.resolve(config);
    this.logger.info(SubprocessCopy.spawnRequestedLog, {
      daemon: name,
      config: resolvedConfig,
    });
    const child = this.processController.spawnDaemonProcess(
      name,
      resolvedConfig,
    );

    const managed: ManagedSubprocess = {
      name,
      child,
      config: resolvedConfig,
      stdout: [],
      stderr: [],
      events: [],
      startedAtMs: Date.now(),
      status: SubprocessStatus.RUNNING,
      stopRequested: false,
      terminationTimedOut: false,
    };
    this.processes.set(name, managed);
    this.logger.info(SubprocessCopy.startedLog, {
      daemon: name,
      pid: child.pid,
    });
    this.startHeartbeat(managed);

    child.stdout?.on("data", (chunk) => {
      const text = this.outputRingBuffer.limitChunk(chunk.toString());
      const lines = this.outputRingBuffer.appendLines(managed.stdout, text);
      this.logger.info(SubprocessCopy.stdoutLog, { daemon: name, text });
      const events = lines.map((line) =>
        this.outputEventParser.parseOutputLine(name, line),
      );
      for (const event of events) {
        this.lifecycleEventRecorder.recordDaemonEvent(managed, event);
      }
    });
    child.stderr?.on("data", (chunk) => {
      const text = this.outputRingBuffer.limitChunk(chunk.toString());
      const lines = this.outputRingBuffer.appendLines(managed.stderr, text);
      this.logger.warn(SubprocessCopy.stderrLog, { daemon: name, text });
      for (const line of lines) {
        this.lifecycleEventRecorder.recordDaemonEvent(managed, {
          daemon: name,
          status: "processing",
          source: name,
          category: "stderr",
          message: line,
          timestampMs: Date.now(),
          errorMessage: line,
        });
      }
    });
    child.on("close", (code, signal) => {
      this.stopHeartbeat(managed);
      managed.exitCode = code;
      managed.exitSignal = signal;
      managed.status = this.resolveClosedStatus(managed, code);
      this.lifecycleEventRecorder.recordTerminalEvent(managed);
      this.logger.info(SubprocessCopy.closedLog, {
        daemon: name,
        exitCode: code,
        signal,
        stopRequested: managed.stopRequested,
        status: managed.status,
      });
    });
    child.on("error", (error) => {
      this.stopHeartbeat(managed);
      const errorMessage = this.outputEventParser.boundTextField(error.message);
      this.outputRingBuffer.appendLines(managed.stderr, errorMessage);
      if (!managed.stopRequested || managed.terminationTimedOut) {
        managed.status = SubprocessStatus.FAILED;
        this.lifecycleEventRecorder.recordTerminalEvent(managed, errorMessage);
      } else if (managed.status !== SubprocessStatus.STOPPING) {
        managed.status = SubprocessStatus.STOPPED;
        this.lifecycleEventRecorder.recordTerminalEvent(managed, errorMessage);
      }
      this.logger.error(
        SubprocessCopy.errorLog,
        this.lifecycleEventRecorder.boundErrorForLog(error),
        {
          daemon: name,
          stopRequested: managed.stopRequested,
          status: managed.status,
        },
      );
    });

    return this.snapshotMapper.fromManagedSubprocess(managed);
  }

  async terminate(name: DaemonName): Promise<SubprocessSnapshot> {
    const managed = this.processes.get(name);
    if (
      managed?.status === SubprocessStatus.STOPPING &&
      managed.termination !== undefined
    ) {
      return managed.termination;
    }
    if (managed === undefined || managed.status !== SubprocessStatus.RUNNING) {
      return this.getStatus(name);
    }

    managed.termination = this.terminateManagedSubprocess(managed);
    return managed.termination;
  }

  async terminateAll(): Promise<void> {
    await Promise.all(
      Array.from(this.processes.keys()).map((name) => this.terminate(name)),
    );
  }

  getStatus(name: DaemonName): SubprocessSnapshot {
    const managed = this.processes.get(name);
    if (managed === undefined) {
      return this.snapshotMapper.stopped(name);
    }

    return this.snapshotMapper.fromManagedSubprocess(managed);
  }

  getAllStatuses(): readonly SubprocessSnapshot[] {
    return WORKER_DAEMON_NAMES.map((name) => this.getStatus(name));
  }

  private async terminateManagedSubprocess(
    managed: ManagedSubprocess,
  ): Promise<SubprocessSnapshot> {
    const name = managed.name;
    const strategy =
      managed.child.pid === undefined
        ? { kind: "no-pid" as const }
        : this.processController.getTerminationStrategy(managed.child);
    try {
      managed.stopRequested = true;
      managed.status = SubprocessStatus.STOPPING;
      this.lifecycleEventRecorder.recordStopping(managed);
      this.logger.info(SubprocessCopy.terminationRequestedLog, {
        daemon: name,
        pid: managed.child.pid,
        strategy,
      });
      const result = await this.processController.terminateDaemonProcess(
        managed.child,
      );
      this.applyTerminationResult(managed, result);
    } catch (error) {
      managed.stopRequested = false;
      managed.status = SubprocessStatus.FAILED;
      const errorMessage = this.outputEventParser.boundTextField(
        error instanceof Error ? error.message : String(error),
      );
      this.outputRingBuffer.appendLines(managed.stderr, errorMessage);
      this.lifecycleEventRecorder.recordFailed(managed, errorMessage);
      this.logger.error(
        SubprocessCopy.terminationFailedLog,
        this.lifecycleEventRecorder.boundErrorForLog(error),
        {
          daemon: name,
          pid: managed.child.pid,
          stopRequested: managed.stopRequested,
        },
      );
    } finally {
      managed.termination = undefined;
    }
    return this.snapshotMapper.fromManagedSubprocess(managed);
  }

  private resolveClosedStatus(
    process: ManagedSubprocess,
    code: number | null,
  ): SubprocessStatusValue {
    if (process.terminationTimedOut) {
      return SubprocessStatus.FAILED;
    }

    if (process.stopRequested) {
      return SubprocessStatus.STOPPED;
    }

    return code === 0 ? SubprocessStatus.STOPPED : SubprocessStatus.FAILED;
  }

  private applyTerminationResult(
    managed: ManagedSubprocess,
    result: WorkerDaemonTerminationResult,
  ): void {
    if (result.status === "timeout") {
      this.recordTerminationTimeout(managed, result);
      return;
    }

    if (result.status === "no-pid") {
      this.stopHeartbeat(managed);
      managed.status = SubprocessStatus.STOPPED;
      this.lifecycleEventRecorder.recordStopped(managed);
    }

    if (
      result.status === "closed" &&
      managed.status === SubprocessStatus.STOPPING
    ) {
      managed.exitCode = result.exitCode;
      managed.exitSignal = result.exitSignal;
      managed.status = SubprocessStatus.STOPPED;
      this.lifecycleEventRecorder.recordStopped(managed);
    }

    this.logger.info(SubprocessCopy.terminationCompletedLog, {
      daemon: managed.name,
      pid: managed.child.pid,
      stopRequested: managed.stopRequested,
      status: managed.status,
    });
  }

  private recordTerminationTimeout(
    managed: ManagedSubprocess,
    result: Extract<
      WorkerDaemonTerminationResult,
      { readonly status: "timeout" }
    >,
  ): void {
    this.stopHeartbeat(managed);
    managed.terminationTimedOut = true;
    managed.status = SubprocessStatus.FAILED;
    const errorMessage = this.outputEventParser.boundTextField(
      `Timed out after ${result.timeoutMs}ms waiting for daemon process close.`,
    );
    this.outputRingBuffer.appendLines(managed.stderr, errorMessage);
    this.lifecycleEventRecorder.recordFailed(managed, errorMessage);
    this.logger.error(
      SubprocessCopy.terminationTimedOutLog,
      new Error(errorMessage),
      {
        daemon: managed.name,
        pid: managed.child.pid,
        stopRequested: managed.stopRequested,
        timeoutMs: result.timeoutMs,
        strategy: result.strategy,
        escalation: result.escalation,
      },
    );
  }

  private startHeartbeat(managed: ManagedSubprocess): void {
    managed.heartbeatTimer = setInterval(() => {
      if (managed.status !== SubprocessStatus.RUNNING) {
        return;
      }

      const latestEvent = managed.events[managed.events.length - 1];
      const now = Date.now();
      if (
        latestEvent?.timestampMs !== undefined &&
        now - latestEvent.timestampMs < DAEMON_HEARTBEAT_INTERVAL_MS
      ) {
        return;
      }

      this.lifecycleEventRecorder.recordDaemonEvent(managed, {
        daemon: managed.name,
        status: "processing",
        source: managed.name,
        category: "heartbeat",
        message: "daemon still running",
        timestampMs: now,
        phase: latestEvent?.phase ?? "running",
        goalId: latestEvent?.goalId,
        attempt: latestEvent?.attempt,
        maxRetries: latestEvent?.maxRetries,
        elapsedMs: this.resolveHeartbeatElapsedMs(managed, latestEvent, now),
      });
    }, DAEMON_HEARTBEAT_INTERVAL_MS);

    if (
      typeof managed.heartbeatTimer === "object" &&
      "unref" in managed.heartbeatTimer
    ) {
      managed.heartbeatTimer.unref();
    }
  }

  private stopHeartbeat(managed: ManagedSubprocess): void {
    if (managed.heartbeatTimer === undefined) {
      return;
    }

    clearInterval(managed.heartbeatTimer);
    managed.heartbeatTimer = undefined;
  }

  private resolveHeartbeatElapsedMs(
    managed: ManagedSubprocess,
    latestEvent: ManagedSubprocess["events"][number] | undefined,
    now: number,
  ): number {
    if (
      latestEvent?.elapsedMs !== undefined &&
      latestEvent.timestampMs !== undefined
    ) {
      return latestEvent.elapsedMs + Math.max(0, now - latestEvent.timestampMs);
    }

    return Math.max(0, now - managed.startedAtMs);
  }
}
