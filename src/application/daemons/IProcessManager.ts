export interface ProcessManagerOptions {
  readonly agentId: string;
  readonly maxRetries: number;
  readonly emit?: (event: ProcessManagerEvent) => void;
}

export type ProcessManagerStatus =
  "idle" | "processing" | "completed" | "skipped" | "exhausted" | "failed";

export interface ProcessManagerEvent {
  readonly daemon: string;
  readonly status: ProcessManagerStatus;
  readonly source?: string;
  readonly category?: string;
  readonly message?: string;
  readonly timestampMs?: number;
  readonly phase?: string;
  readonly elapsedMs?: number;
  readonly goalId?: string;
  readonly attempt?: number;
  readonly maxRetries?: number;
  readonly exitCode?: number;
  readonly errorType?: string;
  readonly errorMessage?: string;
}

export interface ProcessManagerResult {
  readonly status: ProcessManagerStatus;
  readonly goalId?: string;
  readonly attempts: number;
}

export interface IProcessManager {
  processNext(options: ProcessManagerOptions): Promise<ProcessManagerResult>;
}
