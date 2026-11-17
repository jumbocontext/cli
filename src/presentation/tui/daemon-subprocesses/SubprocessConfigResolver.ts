import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type { DaemonConfig } from "./DaemonConfig.js";

export class SubprocessConfigResolver {
  resolve(config: Partial<DaemonConfig>): DaemonConfig {
    return {
      agentId: config.agentId ?? DEFAULT_WORKER_DAEMON_CONFIG.agentId,
      pollIntervalMs:
        config.pollIntervalMs ?? DEFAULT_WORKER_DAEMON_CONFIG.pollIntervalMs,
      maxRetries: config.maxRetries ?? DEFAULT_WORKER_DAEMON_CONFIG.maxRetries,
    };
  }
}
