import { describe, expect, it } from "@jest/globals";
import { DaemonEventStatus, type DaemonEventStatusValue } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonEventStatus.js";

describe("DaemonEventStatus", () => {
  it("defines daemon event terminal and lifecycle status values", () => {
    expect(DaemonEventStatus).toEqual({
      STARTING: "starting",
      STOPPING: "stopping",
      STOPPED: "stopped",
      FAILED: "failed",
      IDLE: "idle",
      PROCESSING: "processing",
      COMPLETED: "completed",
      SKIPPED: "skipped",
      EXHAUSTED: "exhausted",
      CODIFYING: "codifying",
    });
  });

  it("derives a typed union from the constant surface", () => {
    const terminalStatus: DaemonEventStatusValue = "failed";
    const processingStatus: DaemonEventStatusValue = "processing";
    expect(Object.values(DaemonEventStatus)).toContain(terminalStatus);
    expect(Object.values(DaemonEventStatus)).toContain(processingStatus);
  });
});
