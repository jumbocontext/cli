import { describe, expect, it } from "@jest/globals";
import type { DaemonCounts } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonCounts.js";

describe("DaemonCounts", () => {
  it("captures subprocess totals by status", () => {
    const counts: DaemonCounts = {
      running: 1,
      stopped: 1,
      failed: 1,
    };

    expect(counts.running + counts.stopped + counts.failed).toBe(3);
  });
});
