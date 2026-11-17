import type {
  WorkerDaemonConfig,
  WorkerDaemonName,
} from "./WorkerDaemonCatalog.js";

export const DEFAULT_WORKER_DAEMON_TERMINATION_TIMEOUT_MS = 5_000;

export type WorkerDaemonTerminationStrategy =
  | {
      readonly kind: "windows-tree";
      readonly command: "taskkill";
      readonly args: readonly string[];
      readonly escalationArgs: readonly string[];
    }
  | {
      readonly kind: "unix-process-group";
      readonly signal: "SIGTERM";
      readonly escalationSignal: "SIGKILL";
      readonly pid: number;
    }
  | {
      readonly kind: "no-pid";
    };

export type WorkerDaemonTerminationResult =
  | {
      readonly status: "closed";
      readonly strategy: WorkerDaemonTerminationStrategy;
      readonly exitCode: number | null;
      readonly exitSignal: string | null;
    }
  | {
      readonly status: "timeout";
      readonly strategy: WorkerDaemonTerminationStrategy;
      readonly timeoutMs: number;
      readonly escalation: WorkerDaemonTerminationEscalation;
    }
  | {
      readonly status: "no-pid";
      readonly strategy: Extract<
        WorkerDaemonTerminationStrategy,
        { readonly kind: "no-pid" }
      >;
    };

export type WorkerDaemonTerminationEscalation =
  | {
      readonly kind: "windows-tree-force";
      readonly command: "taskkill";
      readonly args: readonly string[];
    }
  | {
      readonly kind: "unix-process-group-kill";
      readonly signal: "SIGKILL";
      readonly pid: number;
    };

export interface WorkerDaemonOutputStream {
  on(event: "data", listener: (chunk: { toString(): string }) => void): this;
}

export interface WorkerDaemonProcess {
  readonly pid?: number;
  readonly stdout?: WorkerDaemonOutputStream;
  readonly stderr?: WorkerDaemonOutputStream;
  on(
    event: "close",
    listener: (code: number | null, signal: string | null) => void,
  ): this;
  on(event: "error", listener: (error: Error) => void): this;
}

export interface IWorkerDaemonProcessController {
  spawnDaemonProcess(
    name: WorkerDaemonName,
    config: WorkerDaemonConfig,
  ): WorkerDaemonProcess;
  terminateDaemonProcess(
    process: WorkerDaemonProcess,
    timeoutMs?: number,
  ): Promise<WorkerDaemonTerminationResult>;
  getTerminationStrategy(
    process: WorkerDaemonProcess,
  ): WorkerDaemonTerminationStrategy;
}
