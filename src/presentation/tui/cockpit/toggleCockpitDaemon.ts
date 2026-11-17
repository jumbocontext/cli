import { CockpitDaemonEvents } from "./CockpitDaemonEvents.js";
import type { DaemonEventRow } from "./DaemonEventRow.js";
import type {
  ISubprocessManager,
  DaemonConfig,
  DaemonName,
  SubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { SubprocessStatus } from "../daemon-subprocesses/SubprocessStatus.js";

export async function toggleCockpitDaemon(
  name: DaemonName,
  manager: ISubprocessManager,
  config: DaemonConfig,
  setDaemonStatuses: (statuses: readonly SubprocessSnapshot[]) => void,
  setDaemonEventRows: (
    update: (
      currentRows: readonly DaemonEventRow[],
    ) => readonly DaemonEventRow[],
  ) => void,
): Promise<void> {
  const snapshot = manager.getStatus(name);
  if (snapshot.status === SubprocessStatus.RUNNING) {
    await manager.terminate(name);
  } else if (snapshot.status !== SubprocessStatus.STOPPING) {
    await manager.spawn(name, config);
  }
  const snapshots = manager.getAllStatuses();
  setDaemonStatuses(snapshots);
  setDaemonEventRows((currentRows) =>
    CockpitDaemonEvents.appendRows(
      currentRows,
      CockpitDaemonEvents.getRows(snapshots, Date.now()),
    ),
  );
}
