import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { DecisionAddFlow } from "../../../../../../src/presentation/tui/memory/decisions/DecisionAddFlow.js";

describe("DecisionAddFlow", () => {
  it("renders the first step using the wizard primitive", () => {
    const { lastFrame, unmount } = render(
      <DecisionAddFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Add Decision");
    expect(frame).toContain("1/5");
    unmount();
  });

  it("invokes onCancel when escape is pressed", async () => {
    let cancelled = false;
    const { stdin, unmount } = render(
      <DecisionAddFlow
        onComplete={() => {}}
        onCancel={() => {
          cancelled = true;
        }}
      />,
    );

    stdin.write("\x1B");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(cancelled).toBe(true);
    unmount();
  });
});
