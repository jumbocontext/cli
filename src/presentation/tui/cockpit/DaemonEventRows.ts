import type { SubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import type { DaemonEventRow } from "./DaemonEventRow.js";
import { DaemonEventRowNormalizer } from "./DaemonEventRowNormalizer.js";

const RENDERED_DAEMON_EVENT_LIMIT = 10;
const TERMINAL_ROW_CATEGORIES = new Set([
  "completed",
  "failed",
  "exhausted",
  "stopped",
]);

export const DaemonEventRows = {
  append,
  fromSnapshots,
} as const;

function fromSnapshots(
  snapshots: readonly SubprocessSnapshot[],
  observedAtMs: number,
): readonly DaemonEventRow[] {
  const rows = snapshots.flatMap((snapshot) =>
    DaemonEventRowNormalizer.fromSnapshot(snapshot, observedAtMs),
  );

  return trimRows(newestFirst(rows));
}

function append(
  currentRows: readonly DaemonEventRow[],
  nextRows: readonly DaemonEventRow[],
): readonly DaemonEventRow[] {
  const currentKeys = new Set(currentRows.map((row) => row.key));
  const appendedRows = nextRows.filter((row) => !currentKeys.has(row.key));

  if (appendedRows.length === 0) {
    return currentRows;
  }

  return trimRows(newestFirst([...currentRows, ...appendedRows]));
}

function newestFirst(
  rows: readonly DaemonEventRow[],
): readonly DaemonEventRow[] {
  return [...rows].sort((left, right) => right.timestampMs - left.timestampMs);
}

function trimRows(rows: readonly DaemonEventRow[]): readonly DaemonEventRow[] {
  if (rows.length <= RENDERED_DAEMON_EVENT_LIMIT) {
    return rows;
  }

  const selected = rows.slice(0, RENDERED_DAEMON_EVENT_LIMIT);
  for (const terminalRow of rows.filter(isTerminalRow)) {
    if (selected.some((row) => row.key === terminalRow.key)) {
      continue;
    }

    const replaceIndex = findOldestNonTerminalIndex(selected);
    if (replaceIndex === -1) {
      break;
    }
    selected[replaceIndex] = terminalRow;
  }

  return newestFirst(selected);
}

function findOldestNonTerminalIndex(rows: readonly DaemonEventRow[]): number {
  for (let index = rows.length - 1; index >= 0; index--) {
    if (!isTerminalRow(rows[index])) {
      return index;
    }
  }

  return -1;
}

function isTerminalRow(row: DaemonEventRow): boolean {
  return TERMINAL_ROW_CATEGORIES.has(row.category);
}
