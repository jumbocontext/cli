import { describe, expect, it } from "@jest/globals";
import type { CockpitDaemonEventSnapshot } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonEventSnapshot.js";

describe("CockpitDaemonEventSnapshot", () => {
  it("captures the presentation-consumed daemon event status", () => {
    const event: CockpitDaemonEventSnapshot = {
      status: "retrying",
    };

    expect(Object.keys(event)).toEqual(["status"]);
  });
});
