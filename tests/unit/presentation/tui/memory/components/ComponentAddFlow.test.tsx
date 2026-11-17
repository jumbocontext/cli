import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { ComponentAddFlow } from "../../../../../../src/presentation/tui/memory/components/ComponentAddFlow.js";

describe("ComponentAddFlow", () => {
  it("renders the first step using the wizard primitive", () => {
    const { lastFrame, unmount } = render(
      <ComponentAddFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Add Component");
    expect(frame).toContain("1/3");
    expect(frame).not.toContain("Path");
    unmount();
  });

  it("invokes onCancel when escape is pressed", async () => {
    let cancelled = false;
    const { stdin, unmount } = render(
      <ComponentAddFlow
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
