import type { CockpitDaemonEventSnapshot } from "./CockpitDaemonEventSnapshot.js";
import type { SubprocessStatusValue } from "../daemon-subprocesses/SubprocessStatus.js";

export interface CockpitDaemonSnapshot {
  readonly status: SubprocessStatusValue;
  readonly events: readonly CockpitDaemonEventSnapshot[];
}
