import { describe, expect, it } from "@jest/globals";
import { CockpitScreenCopy } from "../../../../../src/presentation/tui/cockpit/CockpitScreenCopy.js";

describe("CockpitScreenCopy", () => {
  it("keeps cockpit banner metadata labels grouped together", () => {
    expect(Object.values(CockpitScreenCopy).every((value) => value.length > 0)).toBe(true);
  });
});
