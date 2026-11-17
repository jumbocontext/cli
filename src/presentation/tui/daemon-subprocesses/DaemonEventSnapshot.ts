import type { DaemonEventStatusValue } from "./DaemonEventStatus.js";

export interface DaemonEventSnapshot {
  readonly daemon: string;
  readonly status: DaemonEventStatusValue | (string & {});
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
