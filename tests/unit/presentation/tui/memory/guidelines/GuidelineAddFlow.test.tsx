import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { GuidelineAddFlow } from "../../../../../../src/presentation/tui/memory/guidelines/GuidelineAddFlow.js";

describe("GuidelineAddFlow", () => {
  it("renders the first step using the wizard primitive", () => {
    const { lastFrame, unmount } = render(
      <GuidelineAddFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Add Guideline");
    expect(frame).toContain("1/4");
    unmount();
  });

  it("invokes onCancel when escape is pressed", async () => {
    let cancelled = false;
    const { stdin, unmount } = render(
      <GuidelineAddFlow
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
