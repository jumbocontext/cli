import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitGreeterCopy } from "../../../../../src/presentation/tui/cockpit/CockpitGreeterCopy.js";
import { CockpitGreeterView } from "../../../../../src/presentation/tui/cockpit/CockpitGreeterView.js";

describe("CockpitGreeterView", () => {
  it("renders greeter body and initialize affordance from greeter copy", () => {
    const { lastFrame, unmount } = render(<CockpitGreeterView />);

    expect(lastFrame()).toContain(CockpitGreeterCopy.body[0]);
    expect(lastFrame()).toContain(CockpitGreeterCopy.initializePrompt.keyChar);
    expect(lastFrame()).toContain(CockpitGreeterCopy.initializePrompt.suffix.trim());
    unmount();
  });
});
