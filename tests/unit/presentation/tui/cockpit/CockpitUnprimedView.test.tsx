import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitUnprimedCopy } from "../../../../../src/presentation/tui/cockpit/CockpitUnprimedCopy.js";
import { CockpitUnprimedView } from "../../../../../src/presentation/tui/cockpit/CockpitUnprimedView.js";

describe("CockpitUnprimedView", () => {
  it("renders priming guidance and skip affordance from unprimed copy", () => {
    const { lastFrame, unmount } = render(<CockpitUnprimedView />);

    expect(lastFrame()).toContain(CockpitUnprimedCopy.nextStepsHeading);
    expect(lastFrame()).toContain(CockpitUnprimedCopy.skipPrompt.keyChar);
    expect(lastFrame()).toContain(CockpitUnprimedCopy.skipPrompt.suffix.trim());
    unmount();
  });
});
