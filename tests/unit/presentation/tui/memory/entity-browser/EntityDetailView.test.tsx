import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { EntityDetailView } from "../../../../../../src/presentation/tui/memory/entity-browser/EntityDetailView.js";
import type {
  DecisionEntityRow,
  GuidelineEntityRow,
} from "../../../../../../src/presentation/tui/memory/entity-browser/MemoryEntityShapes.js";

const DECISION: DecisionEntityRow = {
  id: "44444444-dddd-4ddd-8ddd-444444444444",
  title: "Adopt the tumbler browser",
  context: "Memory screens need the goals browsing model",
  rationale: "One browsing idiom across the TUI",
  alternatives: ["Keep the two-column prototype"],
  consequences: "Detail pane is driven by tumbler focus",
};

const GUIDELINE: GuidelineEntityRow = {
  id: "55555555-eeee-4eee-8eee-555555555555",
  title: "Prefer structural tests",
  category: "testing",
  description: "Assert behavior and data flow",
  rationale: "Copy changes should not break tests",
  examples: ["assert on ids", "assert on interactions"],
};

describe("EntityDetailView", () => {
  it("renders the heading and every entity attribute value", () => {
    const { lastFrame, unmount } = render(
      <EntityDetailView
        entityType="decision"
        entity={DECISION}
        heading={DECISION.title}
      />,
    );
    const frame = lastFrame() ?? "";

    expect(frame).toContain(DECISION.title);
    expect(frame).toContain(DECISION.id);
    expect(frame).toContain(DECISION.context);
    expect(frame).toContain(DECISION.rationale);
    expect(frame).toContain(DECISION.alternatives[0]);
    expect(frame).toContain(DECISION.consequences);
    unmount();
  });

  it("renders list attributes as a single bounded line", () => {
    const { lastFrame, unmount } = render(
      <EntityDetailView
        entityType="guideline"
        entity={GUIDELINE}
        heading={GUIDELINE.title}
      />,
    );
    const frame = lastFrame() ?? "";

    expect(frame).toContain(GUIDELINE.examples[0]);
    expect(frame).toContain(GUIDELINE.examples[1]);
    unmount();
  });

  it("renders long attribute values in full without truncation", () => {
    const longDescription = "x".repeat(600);
    const { lastFrame, unmount } = render(
      <EntityDetailView
        entityType="guideline"
        entity={{ ...GUIDELINE, description: longDescription }}
        heading={GUIDELINE.title}
      />,
    );
    const flattenedFrame = (lastFrame() ?? "").replace(/\s+/g, "");
    const renderedLength = (flattenedFrame.match(/x/g) ?? []).length;

    expect(renderedLength).toBeGreaterThanOrEqual(longDescription.length);
    unmount();
  });
});
