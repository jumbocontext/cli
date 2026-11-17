import type React from "react";
import { useEffect, useState } from "react";
import { CockpitDaemonEvents } from "./CockpitDaemonEvents.js";
import type { DaemonEventRow } from "./DaemonEventRow.js";
import type {
  ISubprocessManager,
  SubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";

export function useDaemonStatusPolling(subprocessManager: ISubprocessManager): {
  readonly daemonStatuses: readonly SubprocessSnapshot[];
  readonly daemonEventRows: readonly DaemonEventRow[];
  readonly setDaemonStatuses: React.Dispatch<
    React.SetStateAction<readonly SubprocessSnapshot[]>
  >;
  readonly setDaemonEventRows: React.Dispatch<
    React.SetStateAction<readonly DaemonEventRow[]>
  >;
} {
  const [daemonStatuses, setDaemonStatuses] = useState<
    readonly SubprocessSnapshot[]
  >(subprocessManager.getAllStatuses());
  const [daemonEventRows, setDaemonEventRows] = useState<
    readonly DaemonEventRow[]
  >(() =>
    CockpitDaemonEvents.getRows(subprocessManager.getAllStatuses(), Date.now()),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const snapshots = subprocessManager.getAllStatuses();
      setDaemonStatuses(snapshots);
      setDaemonEventRows((currentRows) =>
        CockpitDaemonEvents.appendRows(
          currentRows,
          CockpitDaemonEvents.getRows(snapshots, Date.now()),
        ),
      );
    }, 500);

    return () => clearInterval(timer);
  }, [subprocessManager]);

  return {
    daemonStatuses,
    daemonEventRows,
    setDaemonStatuses,
    setDaemonEventRows,
  };
}
