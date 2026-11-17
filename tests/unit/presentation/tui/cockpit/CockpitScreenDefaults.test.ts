import { describe, expect, it } from "@jest/globals";
import { CockpitScreenDefaults } from "../../../../../src/presentation/tui/cockpit/CockpitScreenDefaults.js";

describe("CockpitScreenDefaults", () => {
  it("keeps fallback launch dimensions positive", () => {
    expect(CockpitScreenDefaults.placeholderVersion.length).toBeGreaterThan(0);
    expect(CockpitScreenDefaults.terminalWidth).toBeGreaterThan(0);
    expect(CockpitScreenDefaults.bodyHeight).toBeGreaterThan(0);
  });
});
