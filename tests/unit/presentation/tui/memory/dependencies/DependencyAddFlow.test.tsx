import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { DependencyAddFlow } from "../../../../../../src/presentation/tui/memory/dependencies/DependencyAddFlow.js";

describe("DependencyAddFlow", () => {
  it("renders the first step using the wizard primitive", () => {
    const { lastFrame, unmount } = render(
      <DependencyAddFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Add Dependency");
    expect(frame).toContain("1/3");
    unmount();
  });

  it("invokes onCancel when escape is pressed", async () => {
    let cancelled = false;
    const { stdin, unmount } = render(
      <DependencyAddFlow
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
