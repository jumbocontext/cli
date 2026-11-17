import { describe, expect, it } from "@jest/globals";
import { CockpitGreeterCopy } from "../../../../../src/presentation/tui/cockpit/CockpitGreeterCopy.js";

describe("CockpitGreeterCopy", () => {
  it("keeps greeter body and initialize prompt copy grouped together", () => {
    expect(CockpitGreeterCopy.body.length).toBeGreaterThan(0);
    expect(CockpitGreeterCopy.initializePrompt.keyChar).toHaveLength(1);
    expect(CockpitGreeterCopy.initializePrompt.secondary.length).toBeGreaterThan(0);
  });
});
