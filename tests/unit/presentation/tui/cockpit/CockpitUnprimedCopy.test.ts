import { describe, expect, it } from "@jest/globals";
import { CockpitUnprimedCopy } from "../../../../../src/presentation/tui/cockpit/CockpitUnprimedCopy.js";

describe("CockpitUnprimedCopy", () => {
  it("keeps unprimed guidance, steps, note, and skip prompt together", () => {
    expect(CockpitUnprimedCopy.intro.length).toBeGreaterThan(0);
    expect(CockpitUnprimedCopy.nextSteps).toHaveLength(3);
    expect(CockpitUnprimedCopy.agentNudgeNote.length).toBeGreaterThan(0);
    expect(CockpitUnprimedCopy.skipPrompt.keyChar).toHaveLength(1);
  });
});
