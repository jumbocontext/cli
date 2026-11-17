import { describe, expect, it } from "@jest/globals";
import type { DaemonEventSnapshot } from "../../../../../src/presentation/tui/daemon-subprocesses/DaemonEventSnapshot.js";

describe("DaemonEventSnapshot", () => {
  it("captures daemon event status and optional progress metadata", () => {
    const event: DaemonEventSnapshot = {
      daemon: "refiner",
      status: "processing",
      source: "refiner",
      category: "model-output",
      message: "updated goal context",
      timestampMs: 1767272400000,
      goalId: "goal_123",
      attempt: 1,
      maxRetries: 3,
    };

    expect(event).toEqual(expect.objectContaining({
      daemon: "refiner",
      status: "processing",
      goalId: "goal_123",
    }));
  });
});
