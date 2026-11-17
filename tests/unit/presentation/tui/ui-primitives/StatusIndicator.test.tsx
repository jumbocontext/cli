import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { StatusIndicator } from "../../../../../src/presentation/tui/ui-primitives/StatusIndicator.js";

describe("StatusIndicator", () => {
  it("renders the label", () => {
    const { lastFrame } = render(
      <StatusIndicator label="sync" status="idle" />,
    );
    expect(lastFrame()).toContain("sync");
  });

  it("renders the status text", () => {
    const { lastFrame } = render(
      <StatusIndicator label="watch" status="off" />,
    );
    expect(lastFrame()).toContain("off");
  });

  it("renders the filled circle glyph", () => {
    const { lastFrame } = render(
      <StatusIndicator label="daemon" status="active" />,
    );
    expect(lastFrame()).toContain("●");
  });

  it("renders active status", () => {
    const { lastFrame } = render(
      <StatusIndicator label="process" status="active" />,
    );
    expect(lastFrame()).toContain("active");
  });

  it("renders error status", () => {
    const { lastFrame } = render(
      <StatusIndicator label="service" status="error" />,
    );
    expect(lastFrame()).toContain("error");
  });
});
