import {
  ISubprocessManager,
  DaemonName,
  SubprocessSnapshot,
} from "./ISubprocessManager.js";
import {
  DEFAULT_WORKER_DAEMON_CONFIG,
  WORKER_DAEMON_NAMES,
} from "../../../application/daemons/WorkerDaemonCatalog.js";
import { SubprocessStatus } from "./SubprocessStatus.js";

export class NoOpSubprocessManager implements ISubprocessManager {
  private readonly snapshots: Map<DaemonName, SubprocessSnapshot> = new Map(
    WORKER_DAEMON_NAMES.map((name) => [name, this.createStoppedSnapshot(name)]),
  );

  async spawn(name: DaemonName): Promise<SubprocessSnapshot> {
    return this.getStatus(name);
  }

  async terminate(name: DaemonName): Promise<SubprocessSnapshot> {
    return this.getStatus(name);
  }

  async terminateAll(): Promise<void> {}

  getStatus(name: DaemonName): SubprocessSnapshot {
    return this.snapshots.get(name) ?? this.createStoppedSnapshot(name);
  }

  getAllStatuses(): readonly SubprocessSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  private createStoppedSnapshot(name: DaemonName): SubprocessSnapshot {
    return {
      name,
      status: SubprocessStatus.STOPPED,
      config: DEFAULT_WORKER_DAEMON_CONFIG,
      stdout: [],
      stderr: [],
      events: [],
    };
  }
}
