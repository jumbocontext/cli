import { BaseColors } from "../../shared/DesignTokens.js";
import type {
  DaemonEventSnapshot,
  DaemonEventStatus,
  SubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { DaemonEventStatus as DaemonEventStatusValues } from "../daemon-subprocesses/DaemonEventStatus.js";
import { SubprocessStatus } from "../daemon-subprocesses/SubprocessStatus.js";
import type { DaemonEventRow } from "./DaemonEventRow.js";
import { DaemonEventRowMessageFormatter } from "./DaemonEventRowMessageFormatter.js";

const DAEMON_EVENT_SOURCE_WIDTH = 8;
const DAEMON_EVENT_CATEGORY_WIDTH = 12;

export const DaemonEventRowNormalizer = {
  fromSnapshot,
} as const;

function fromSnapshot(
  snapshot: SubprocessSnapshot,
  observedAtMs: number,
): readonly DaemonEventRow[] {
  const eventRows = snapshot.events.map((event, eventIndex) =>
    toDaemonEventRow(snapshot, event, eventIndex, observedAtMs),
  );
  const lifecycleRow = getLifecycleEventRow(
    snapshot,
    eventRows.length,
    observedAtMs,
  );

  if (lifecycleRow === undefined) {
    return eventRows;
  }

  return [...eventRows, lifecycleRow];
}

function getLifecycleEventRow(
  snapshot: SubprocessSnapshot,
  eventIndex: number,
  observedAtMs: number,
): DaemonEventRow | undefined {
  if (snapshot.status === SubprocessStatus.STOPPING) {
    return createDaemonEventRow(
      snapshot,
      DaemonEventStatusValues.STOPPING,
      eventIndex,
      observedAtMs,
    );
  }
  if (
    snapshot.status === SubprocessStatus.RUNNING &&
    snapshot.events.length === 0
  ) {
    return createDaemonEventRow(
      snapshot,
      DaemonEventStatusValues.STARTING,
      eventIndex,
      observedAtMs,
    );
  }
  if (snapshot.status === SubprocessStatus.FAILED) {
    return createDaemonEventRow(
      snapshot,
      DaemonEventStatusValues.FAILED,
      eventIndex,
      observedAtMs,
    );
  }
  if (
    snapshot.status === SubprocessStatus.STOPPED &&
    (snapshot.stopRequested === true ||
      snapshot.exitCode !== undefined ||
      snapshot.exitSignal !== undefined)
  ) {
    return createDaemonEventRow(
      snapshot,
      DaemonEventStatusValues.STOPPED,
      eventIndex,
      observedAtMs,
    );
  }
  return undefined;
}

function createDaemonEventRow(
  snapshot: SubprocessSnapshot,
  status: DaemonEventStatus,
  eventIndex: number,
  observedAtMs: number,
): DaemonEventRow {
  return toDaemonEventRow(
    snapshot,
    {
      daemon: snapshot.name,
      status,
      errorMessage: snapshot.stderr[snapshot.stderr.length - 1],
      exitCode: snapshot.exitCode ?? undefined,
    },
    eventIndex,
    observedAtMs,
  );
}

function toDaemonEventRow(
  snapshot: SubprocessSnapshot,
  event: DaemonEventSnapshot,
  eventIndex: number,
  observedAtMs: number,
): DaemonEventRow {
  const status = normalizeDaemonEventStatus(event.status);
  const timestampMs = event.timestampMs ?? observedAtMs;
  const key =
    event.timestampMs === undefined
      ? `${snapshot.name}-lifecycle-${status}-${snapshot.pid ?? "none"}-${snapshot.exitCode ?? "none"}-${snapshot.stopRequested ?? false}`
      : `${snapshot.name}-${eventIndex}-${event.status}-${event.goalId ?? "none"}-${timestampMs}`;

  return {
    key,
    source: normalizeDaemonEventSource(snapshot, event),
    category: normalizeDaemonEventCategory(event, status),
    timestampMs,
    message: DaemonEventRowMessageFormatter.format(snapshot, event),
    color: getDaemonEventColor(status),
  };
}

function normalizeDaemonEventStatus(status: string): DaemonEventStatus {
  if (
    Object.values(DaemonEventStatusValues).includes(status as DaemonEventStatus)
  ) {
    return status as DaemonEventStatus;
  }

  return DaemonEventStatusValues.PROCESSING;
}

function normalizeDaemonEventSource(
  snapshot: SubprocessSnapshot,
  event: DaemonEventSnapshot,
): string {
  return truncateTail(
    event.source ?? event.daemon ?? snapshot.name,
    DAEMON_EVENT_SOURCE_WIDTH,
  );
}

function normalizeDaemonEventCategory(
  event: DaemonEventSnapshot,
  status: DaemonEventStatus,
): string {
  return truncateTail(event.category ?? status, DAEMON_EVENT_CATEGORY_WIDTH);
}

function getDaemonEventColor(status: DaemonEventStatus): string {
  if (status === DaemonEventStatusValues.FAILED) {
    return BaseColors.brandRed;
  }
  if (status === DaemonEventStatusValues.COMPLETED) {
    return BaseColors.brandGreen;
  }
  if (
    status === DaemonEventStatusValues.SKIPPED ||
    status === DaemonEventStatusValues.EXHAUSTED
  ) {
    return BaseColors.brandYellow;
  }
  if (
    status === DaemonEventStatusValues.PROCESSING ||
    status === DaemonEventStatusValues.CODIFYING ||
    status === DaemonEventStatusValues.STARTING ||
    status === DaemonEventStatusValues.STOPPING
  ) {
    return BaseColors.brandBlue;
  }

  return BaseColors.shade4;
}

function truncateTail(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 3) + "...";
}
