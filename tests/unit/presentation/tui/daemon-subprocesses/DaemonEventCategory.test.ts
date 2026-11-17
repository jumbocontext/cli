import { describe, expect, it } from "@jest/globals";
import { DaemonEventCategory } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonEventCategory.js";
import { DaemonEventStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonEventStatus.js";

describe("DaemonEventCategory", () => {
  it("maps lifecycle event categories to daemon event status values", () => {
    expect(DaemonEventCategory.MODEL_OUTPUT).toBe("model-output");
    expect(DaemonEventCategory.STOPPING).toBe(DaemonEventStatus.STOPPING);
    expect(DaemonEventCategory.STOPPED).toBe(DaemonEventStatus.STOPPED);
    expect(DaemonEventCategory.FAILED).toBe(DaemonEventStatus.FAILED);
  });
});
