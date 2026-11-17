import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitPrimedEmptyCopy } from "../../../../../src/presentation/tui/cockpit/CockpitPrimedEmptyCopy.js";
import { CockpitPrimedEmptyView } from "../../../../../src/presentation/tui/cockpit/CockpitPrimedEmptyView.js";

describe("CockpitPrimedEmptyView", () => {
  it("renders empty-goal guidance and add-goal affordance from primed-empty copy", () => {
    const { lastFrame, unmount } = render(<CockpitPrimedEmptyView />);

    expect(lastFrame()).toContain(CockpitPrimedEmptyCopy.intro);
    expect(lastFrame()).toContain(CockpitPrimedEmptyCopy.addGoalPrompt.keyChar);
    expect(lastFrame()).toContain(CockpitPrimedEmptyCopy.primerHeading);
    unmount();
  });
});
