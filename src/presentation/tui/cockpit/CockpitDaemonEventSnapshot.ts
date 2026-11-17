import type { DaemonEventStatusValue } from "../daemon-subprocesses/DaemonEventStatus.js";

export interface CockpitDaemonEventSnapshot {
  readonly status: DaemonEventStatusValue | (string & {});
}
