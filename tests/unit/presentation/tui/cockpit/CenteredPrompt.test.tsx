import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CenteredPrompt } from "../../../../../src/presentation/tui/cockpit/CenteredPrompt.js";

describe("CenteredPrompt", () => {
  it("renders the primary prompt segments around the key badge", () => {
    const { lastFrame, unmount } = render(
      <CenteredPrompt keyChar="a" prefix="Press " suffix=" to add a goal" />,
    );

    expect(lastFrame()).toContain("Press");
    expect(lastFrame()).toContain("a");
    expect(lastFrame()).toContain("to add a goal");
    unmount();
  });

  it("renders secondary guidance only when provided", () => {
    const { lastFrame, rerender, unmount } = render(
      <CenteredPrompt
        keyChar="s"
        prefix="Press "
        suffix=" to skip"
        secondary="You can come back later."
      />,
    );

    expect(lastFrame()).toContain("You can come back later.");

    rerender(<CenteredPrompt keyChar="s" prefix="Press " suffix=" to skip" />);

    expect(lastFrame()).not.toContain("You can come back later.");
    unmount();
  });
});
