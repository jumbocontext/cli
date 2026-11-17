import type { DaemonName } from "../daemon-subprocesses/ISubprocessManager.js";

export function getNextFocusedCockpitDaemon(
  currentDaemon: DaemonName,
  focusOrder: readonly DaemonName[],
): DaemonName {
  const currentIndex = focusOrder.indexOf(currentDaemon);
  const nextIndex =
    currentIndex === -1 ? 0 : (currentIndex + 1) % focusOrder.length;

  return focusOrder[nextIndex];
}
