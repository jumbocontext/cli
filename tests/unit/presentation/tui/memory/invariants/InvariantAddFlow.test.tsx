import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { InvariantAddFlow } from "../../../../../../src/presentation/tui/memory/invariants/InvariantAddFlow.js";

describe("InvariantAddFlow", () => {
  it("renders the first step using the wizard primitive", () => {
    const { lastFrame, unmount } = render(
      <InvariantAddFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Add Invariant");
    expect(frame).toContain("1/3");
    unmount();
  });

  it("invokes onCancel when escape is pressed", async () => {
    let cancelled = false;
    const { stdin, unmount } = render(
      <InvariantAddFlow
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
