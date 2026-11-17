import type { DaemonConfig } from "./DaemonConfig.js";
import type { DaemonName } from "./DaemonName.js";
import type { SubprocessSnapshot } from "./SubprocessSnapshot.js";

export type { DaemonConfig, DaemonConfigs } from "./DaemonConfig.js";
export type { DaemonEventSnapshot } from "./DaemonEventSnapshot.js";
export type { DaemonEventStatusValue as DaemonEventStatus } from "./DaemonEventStatus.js";
export type { DaemonName } from "./DaemonName.js";
export type { DaemonCounts } from "./DaemonCounts.js";
export type { SubprocessSnapshot } from "./SubprocessSnapshot.js";
export type { SubprocessStatusValue as SubprocessStatus } from "./SubprocessStatus.js";

export interface ISubprocessManager {
  spawn(
    name: DaemonName,
    config?: Partial<DaemonConfig>,
  ): Promise<SubprocessSnapshot>;
  terminate(name: DaemonName): Promise<SubprocessSnapshot>;
  terminateAll(): Promise<void>;
  getStatus(name: DaemonName): SubprocessSnapshot;
  getAllStatuses(): readonly SubprocessSnapshot[];
}
