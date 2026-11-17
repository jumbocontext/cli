import { DaemonEventStatus } from "../daemon-subprocesses/DaemonEventStatus.js";
import { SubprocessStatus } from "../daemon-subprocesses/SubprocessStatus.js";
import type { CockpitDaemonSnapshot } from "./CockpitDaemonSnapshot.js";
import type { IDaemonConstants } from "./daemons/IDaemonConstants.js";

export function getDaemonPanelStatusLabel(
  snapshot: CockpitDaemonSnapshot,
  daemonConstants: IDaemonConstants,
): string {
  const latestEvent = snapshot.events[snapshot.events.length - 1];
  if (
    snapshot.status === SubprocessStatus.RUNNING &&
    latestEvent?.status === DaemonEventStatus.IDLE
  ) {
    return `[ ${daemonConstants.idleVerb} ]`;
  }

  const status =
    snapshot.status === SubprocessStatus.RUNNING
      ? daemonConstants.activeVerb
      : snapshot.status;

  return `[ ${status} ]`;
}
