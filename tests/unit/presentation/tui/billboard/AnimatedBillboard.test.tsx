import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import AnimatedBillboard from "../../../../../src/presentation/tui/billboard/AnimatedBillboard.js";

describe("AnimatedBillboard", () => {
  it("renders a non-empty launch animation frame for the requested stage size", () => {
    const { lastFrame, unmount } = render(
      AnimatedBillboard.trigger({ height: 6, width: 24 }),
    );

    expect((lastFrame() ?? "").length).toBeGreaterThan(0);
    unmount();
  });
});
