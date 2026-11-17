import { describe, expect, it } from "@jest/globals";
import { SubprocessStatus, type SubprocessStatusValue } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";

describe("SubprocessStatus", () => {
  it("defines the lifecycle values consumed by subprocess snapshots", () => {
    expect(SubprocessStatus).toEqual({
      STOPPED: "stopped",
      RUNNING: "running",
      STOPPING: "stopping",
      FAILED: "failed",
    });
  });

  it("types status values from its own runtime set", () => {
    const status: SubprocessStatusValue = "running";
    expect(SubprocessStatus).toHaveProperty(status.toUpperCase(), status);
  });
});
