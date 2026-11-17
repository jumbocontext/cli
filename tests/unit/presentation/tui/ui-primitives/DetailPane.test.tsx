import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { DetailPane } from "../../../../../src/presentation/tui/ui-primitives/DetailPane.js";

describe("DetailPane", () => {
  const sampleEntries = [
    { label: "Name", value: "My Project" },
    { label: "Status", value: "Active" },
  ];

  it("renders the panel title", () => {
    const { lastFrame } = render(
      <DetailPane title="Details" entries={sampleEntries} />,
    );
    expect(lastFrame()).toContain("Details");
  });

  it("renders entry labels", () => {
    const { lastFrame } = render(
      <DetailPane title="Info" entries={sampleEntries} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("Name:");
    expect(frame).toContain("Status:");
  });

  it("renders entry values", () => {
    const { lastFrame } = render(
      <DetailPane title="Info" entries={sampleEntries} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("My Project");
    expect(frame).toContain("Active");
  });

  it("renders with a bordered panel", () => {
    const { lastFrame } = render(
      <DetailPane title="Bordered" entries={sampleEntries} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("╭");
    expect(frame).toContain("╯");
  });

  it("handles empty entries", () => {
    const { lastFrame } = render(
      <DetailPane title="Empty" entries={[]} />,
    );
    expect(lastFrame()).toContain("Empty");
  });
});
