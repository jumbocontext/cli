import { describe, expect, it } from "@jest/globals";
import { getNextFocusedCockpitDaemon } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonFocusOrder.js";

describe("CockpitDaemonFocusOrder", () => {
  it("cycles daemon focus in launchpad order", () => {
    const focusOrder = ["refiner", "reviewer", "codifier"] as const;

    expect(getNextFocusedCockpitDaemon("refiner", focusOrder)).toBe("reviewer");
    expect(getNextFocusedCockpitDaemon("reviewer", focusOrder)).toBe("codifier");
    expect(getNextFocusedCockpitDaemon("codifier", focusOrder)).toBe("refiner");
  });

  it("starts at the first daemon when current daemon is outside the focus order", () => {
    const focusOrder = ["reviewer", "codifier"] as const;

    expect(getNextFocusedCockpitDaemon("refiner", focusOrder)).toBe("reviewer");
  });
});
