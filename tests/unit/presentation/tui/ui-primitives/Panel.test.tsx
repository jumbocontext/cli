import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { Panel } from "../../../../../src/presentation/tui/ui-primitives/Panel.js";

describe("Panel", () => {
  it("renders the title", () => {
    const { lastFrame } = render(
      <Panel title="Test Panel">
        <Text>content</Text>
      </Panel>,
    );
    expect(lastFrame()).toContain("Test Panel");
  });

  it("renders child content", () => {
    const { lastFrame } = render(
      <Panel title="Title">
        <Text>Inner content here</Text>
      </Panel>,
    );
    expect(lastFrame()).toContain("Inner content here");
  });

  it("renders a rounded border", () => {
    const { lastFrame } = render(
      <Panel title="Bordered">
        <Text>body</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("╭");
    expect(frame).toContain("╯");
  });

  it("renders multiple children", () => {
    const { lastFrame } = render(
      <Panel title="Multi">
        <Text>Line A</Text>
        <Text>Line B</Text>
      </Panel>,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Line A");
    expect(frame).toContain("Line B");
  });
});
