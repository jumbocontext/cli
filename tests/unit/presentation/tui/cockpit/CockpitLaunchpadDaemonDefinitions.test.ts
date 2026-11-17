import { describe, expect, it } from "@jest/globals";
import { CockpitLaunchpadDaemonDefinitions } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadDaemonDefinitions.js";

describe("CockpitLaunchpadDaemonDefinitions", () => {
  it("declares the launchpad daemon presentation order and focus order together", () => {
    expect(
      CockpitLaunchpadDaemonDefinitions.all.map(
        (definition) => definition.constants.name,
      ),
    ).toEqual(["refiner", "reviewer", "codifier"]);
    expect(CockpitLaunchpadDaemonDefinitions.focusOrder).toEqual([
      "refiner",
      "reviewer",
      "codifier",
    ]);
  });
});
