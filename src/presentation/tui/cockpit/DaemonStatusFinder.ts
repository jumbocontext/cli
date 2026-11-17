import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type {
  DaemonName,
  SubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { SubprocessStatus } from "../daemon-subprocesses/SubprocessStatus.js";

export const DaemonStatusFinder = {
  find,
} as const;

function find(
  statuses: readonly SubprocessSnapshot[],
  name: DaemonName,
): SubprocessSnapshot {
  return (
    statuses.find((status) => status.name === name) ?? {
      name,
      status: SubprocessStatus.STOPPED,
      config: DEFAULT_WORKER_DAEMON_CONFIG,
      stdout: [],
      stderr: [],
      events: [],
    }
  );
}
