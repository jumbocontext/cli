import { describe, expect, it } from "@jest/globals";
import type { CockpitDaemonSnapshot } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonSnapshot.js";

describe("CockpitDaemonSnapshot", () => {
  it("captures daemon panel status with presentation event history", () => {
    const snapshot: CockpitDaemonSnapshot = {
      status: "running",
      events: [{
        status: "processing",
      }],
    };

    expect(snapshot).toEqual(expect.objectContaining({
      status: "running",
      events: [expect.objectContaining({
        status: "processing",
      })],
    }));
  });
});
