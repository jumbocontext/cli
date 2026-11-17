import { describe, expect, it } from "@jest/globals";
import { CockpitLaunchpadCopy } from "../../../../../src/presentation/tui/cockpit/CockpitLaunchpadCopy.js";

describe("CockpitLaunchpadCopy", () => {
  it("keeps launchpad section labels grouped with the launchpad concept", () => {
    expect(CockpitLaunchpadCopy.eventsHeading.length).toBeGreaterThan(0);
  });
});
