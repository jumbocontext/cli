import { describe, expect, it } from "@jest/globals";
import { CockpitPrimedEmptyCopy } from "../../../../../src/presentation/tui/cockpit/CockpitPrimedEmptyCopy.js";

describe("CockpitPrimedEmptyCopy", () => {
  it("keeps empty-goal guidance and add-goal prompt together", () => {
    expect(CockpitPrimedEmptyCopy.intro.length).toBeGreaterThan(0);
    expect(CockpitPrimedEmptyCopy.addGoalPrompt.keyChar).toHaveLength(1);
    expect(CockpitPrimedEmptyCopy.primerHeading.length).toBeGreaterThan(0);
    expect(CockpitPrimedEmptyCopy.primerParagraphs).toHaveLength(3);
  });
});
