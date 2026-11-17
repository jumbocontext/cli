import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { ListPanel } from "../../../../../src/presentation/tui/ui-primitives/ListPanel.js";
import { ListPanelCopy } from "../../../../../src/presentation/tui/ui-primitives/ListPanelConstants.js";

describe("ListPanel", () => {
  const sampleItems = [
    { label: "First item", detail: "[done]" },
    { label: "Second item" },
  ];

  it("renders the panel title", () => {
    const { lastFrame } = render(
      <ListPanel title="My List" items={sampleItems} />,
    );
    expect(lastFrame()).toContain("My List");
  });

  it("renders item labels", () => {
    const { lastFrame } = render(
      <ListPanel title="Items" items={sampleItems} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("First item");
    expect(frame).toContain("Second item");
  });

  it("renders item details when provided", () => {
    const { lastFrame } = render(
      <ListPanel title="Items" items={sampleItems} />,
    );
    expect(lastFrame()).toContain("[done]");
  });

  it("renders bullet glyphs for items", () => {
    const { lastFrame } = render(
      <ListPanel title="Items" items={sampleItems} />,
    );
    expect(lastFrame()).toContain("•");
  });

  it("renders empty message when no items", () => {
    const { lastFrame } = render(
      <ListPanel title="Empty" items={[]} />,
    );
    expect(lastFrame()).toContain(ListPanelCopy.emptyMessage);
  });

  it("renders custom empty message", () => {
    const { lastFrame } = render(
      <ListPanel title="Empty" items={[]} emptyMessage="Nothing here" />,
    );
    expect(lastFrame()).toContain("Nothing here");
  });

  it("renders with a bordered panel", () => {
    const { lastFrame } = render(
      <ListPanel title="Bordered" items={sampleItems} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("╭");
    expect(frame).toContain("╯");
  });
});
