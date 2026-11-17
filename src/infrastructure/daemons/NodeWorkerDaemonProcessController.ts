import { spawn, execFile } from "node:child_process";
import path from "path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type {
  WorkerDaemonConfig,
  WorkerDaemonName,
} from "../../application/daemons/WorkerDaemonCatalog.js";
import type {
  IWorkerDaemonProcessController,
  WorkerDaemonTerminationEscalation,
  WorkerDaemonTerminationResult,
  WorkerDaemonProcess,
  WorkerDaemonTerminationStrategy,
} from "../../application/daemons/IWorkerDaemonProcessController.js";
import { DEFAULT_WORKER_DAEMON_TERMINATION_TIMEOUT_MS } from "../../application/daemons/IWorkerDaemonProcessController.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRESENTATION_WORK_DAEMON_DIRECTORY_SEGMENTS = [
  "..",
  "..",
  "presentation",
  "work",
] as const;

export class NodeWorkerDaemonProcessController implements IWorkerDaemonProcessController {
  constructor(private readonly environment?: NodeJS.ProcessEnv) {}

  spawnDaemonProcess(
    name: WorkerDaemonName,
    config: WorkerDaemonConfig,
  ): WorkerDaemonProcess {
    return spawn(
      process.execPath,
      [
        this.resolveDaemonTarget(name),
        "--agent",
        config.agentId,
        "--poll-interval-ms",
        String(config.pollIntervalMs),
        "--max-retries",
        String(config.maxRetries),
      ],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
        ...(this.environment === undefined ? {} : { env: this.environment }),
      },
    );
  }

  async terminateDaemonProcess(
    process: WorkerDaemonProcess,
    timeoutMs = DEFAULT_WORKER_DAEMON_TERMINATION_TIMEOUT_MS,
  ): Promise<WorkerDaemonTerminationResult> {
    const strategy = this.getTerminationStrategy(process);
    if (strategy.kind === "no-pid") {
      return { status: "no-pid", strategy };
    }

    const closePromise = waitForWorkerDaemonClose(process, strategy, timeoutMs);
    if (strategy.kind === "windows-tree") {
      await execFileAsync(strategy.command, [...strategy.args]);
      return closePromise;
    }

    globalThis.process.kill(strategy.pid, strategy.signal);
    return closePromise;
  }

  getTerminationStrategy(
    process: WorkerDaemonProcess,
  ): WorkerDaemonTerminationStrategy {
    if (process.pid === undefined) {
      return { kind: "no-pid" };
    }

    return getNodeWorkerDaemonTerminationStrategy(
      globalThis.process.platform,
      process.pid,
    );
  }

  private resolveDaemonTarget(name: WorkerDaemonName): string {
    return path.resolve(
      __dirname,
      ...PRESENTATION_WORK_DAEMON_DIRECTORY_SEGMENTS,
      `${name}.daemon.js`,
    );
  }
}

export function getNodeWorkerDaemonTerminationStrategy(
  platform: NodeJS.Platform,
  pid: number,
): Exclude<WorkerDaemonTerminationStrategy, { readonly kind: "no-pid" }> {
  if (platform === "win32") {
    return {
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", String(pid)],
      escalationArgs: ["/F", "/T", "/PID", String(pid)],
    };
  }

  return {
    kind: "unix-process-group",
    signal: "SIGTERM",
    escalationSignal: "SIGKILL",
    pid: -pid,
  };
}

function waitForWorkerDaemonClose(
  process: WorkerDaemonProcess,
  strategy: Exclude<
    WorkerDaemonTerminationStrategy,
    { readonly kind: "no-pid" }
  >,
  timeoutMs: number,
): Promise<WorkerDaemonTerminationResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      const escalation = escalateWorkerDaemonTermination(strategy);
      resolve({
        status: "timeout",
        strategy,
        timeoutMs,
        escalation,
      });
    }, timeoutMs);

    process.on("close", (exitCode, exitSignal) => {
      clearTimeout(timeout);
      resolve({
        status: "closed",
        strategy,
        exitCode,
        exitSignal,
      });
    });
  });
}

function escalateWorkerDaemonTermination(
  strategy: Exclude<
    WorkerDaemonTerminationStrategy,
    { readonly kind: "no-pid" }
  >,
): WorkerDaemonTerminationEscalation {
  if (strategy.kind === "windows-tree") {
    void execFileAsync(strategy.command, [...strategy.escalationArgs]).catch(
      () => undefined,
    );
    return {
      kind: "windows-tree-force",
      command: strategy.command,
      args: strategy.escalationArgs,
    };
  }

  globalThis.process.kill(strategy.pid, strategy.escalationSignal);
  return {
    kind: "unix-process-group-kill",
    signal: strategy.escalationSignal,
    pid: strategy.pid,
  };
}
