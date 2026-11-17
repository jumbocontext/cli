import { describe, expect, it } from "@jest/globals";
import type { CockpitDaemonSnapshot } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonSnapshot.js";
import { getDaemonPanelStatusLabel } from "../../../../../src/presentation/tui/cockpit/DaemonPanelStatusLabel.js";
import type { IDaemonConstants } from "../../../../../src/presentation/tui/cockpit/daemons/IDaemonConstants.js";
import { DaemonEventStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonEventStatus.js";
import { SubprocessStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";

describe("getDaemonPanelStatusLabel", () => {
  it("uses the daemon idle verb when the running daemon latest event is idle", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: SubprocessStatus.RUNNING,
      eventStatuses: [
        DaemonEventStatus.PROCESSING,
        DaemonEventStatus.IDLE,
      ],
    }), daemonConstants)).toBe("[ idle ]");
  });

  it("uses the daemon active verb when the running daemon latest event is not idle", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: SubprocessStatus.RUNNING,
      eventStatuses: [DaemonEventStatus.PROCESSING],
    }), daemonConstants)).toBe("[ active ]");
  });

  it("uses the daemon active verb when the running daemon has no events", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: SubprocessStatus.RUNNING,
      eventStatuses: [],
    }), daemonConstants)).toBe("[ active ]");
  });

  it("uses the subprocess status when the daemon is not running", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: SubprocessStatus.STOPPED,
      eventStatuses: [DaemonEventStatus.IDLE],
    }), daemonConstants)).toBe("[ stopped ]");
  });

  it("uses stopping status while daemon termination is waiting on close", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: SubprocessStatus.STOPPING,
      eventStatuses: [DaemonEventStatus.PROCESSING],
    }), daemonConstants)).toBe("[ stopping ]");
  });
});

const daemonConstants: IDaemonConstants = {
  name: "Reviewer",
  title: "Reviewer daemon",
  activeVerb: "active",
  idleVerb: "idle",
  info: {
    title: "Reviewer info",
    lines: [],
  },
};

function snapshot({
  status,
  eventStatuses,
}: {
  readonly status: CockpitDaemonSnapshot["status"];
  readonly eventStatuses: readonly string[];
}): CockpitDaemonSnapshot {
  return {
    status,
    events: eventStatuses.map((eventStatus) => ({ status: eventStatus })),
  };
}
