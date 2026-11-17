export const WORKER_DAEMON_NAMES = ["reviewer", "refiner", "codifier"] as const;

export type WorkerDaemonName = (typeof WORKER_DAEMON_NAMES)[number];

export interface WorkerDaemonConfig {
  readonly agentId: string;
  readonly pollIntervalMs: number;
  readonly maxRetries: number;
}

export type WorkerDaemonConfigs = Readonly<
  Record<WorkerDaemonName, WorkerDaemonConfig>
>;

export const DEFAULT_WORKER_DAEMON_CONFIG: WorkerDaemonConfig = {
  agentId: "codex",
  pollIntervalMs: 30_000,
  maxRetries: 3,
};

export const DEFAULT_WORKER_DAEMON_CONFIGS: WorkerDaemonConfigs = {
  reviewer: DEFAULT_WORKER_DAEMON_CONFIG,
  refiner: DEFAULT_WORKER_DAEMON_CONFIG,
  codifier: DEFAULT_WORKER_DAEMON_CONFIG,
};
