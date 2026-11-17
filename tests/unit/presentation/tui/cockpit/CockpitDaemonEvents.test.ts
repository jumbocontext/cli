import { describe, expect, it } from "@jest/globals";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../../../src/application/daemons/WorkerDaemonCatalog.js";
import { CockpitDaemonEvents } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonEvents.js";

describe("CockpitDaemonEvents", () => {
  it("exposes the cockpit daemon event presentation operations", () => {
    const rows = CockpitDaemonEvents.getRows([
      {
        name: "reviewer",
        status: "running",
        config: DEFAULT_WORKER_DAEMON_CONFIG,
        stdout: [],
        stderr: [],
        events: [{
          daemon: "reviewer",
          status: "processing",
          message: "reviewing",
          timestampMs: 1767272400000,
        }],
      },
    ], 1767272400500);

    expect(CockpitDaemonEvents.findStatus([], "reviewer").status).toBe("stopped");
    expect(CockpitDaemonEvents.appendRows([], rows)).toHaveLength(1);
    expect(CockpitDaemonEvents.formatRow(rows[0])).toContain("reviewing");
  });
});
