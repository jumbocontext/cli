import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { InvariantsScreen } from "../../../../../../src/presentation/tui/memory/invariants/InvariantsScreen.js";
import { StateReaderProvider } from "../../../../../../src/presentation/tui/state-reading/StateReader.js";

async function waitForFrame(readFrame: () => string | undefined, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(text)) return frame;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFrame() ?? "";
}

describe("InvariantsScreen", () => {
  it("renders a focused invariant list and selected detail", async () => {
    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{
          getInvariantsController: {
            getAllInvariants: async () => ({
              invariants: [{
                invariantId: "invariant_real",
                title: "Real invariant",
                description: "Rendered from a response",
                rationale: "Keeps the route data-backed",
                version: 1,
                createdAt: "2026-05-15T00:00:00.000Z",
                updatedAt: "2026-05-15T00:00:00.000Z",
              }],
            }),
          },
        }}
        options={{ tickMs: 0 }}
      >
        <InvariantsScreen />
      </StateReaderProvider>,
    );
    const frame = await waitForFrame(lastFrame, "invariant_real");

    expect(frame).toContain("invariant_real");
    expect(frame).toContain("Real invariant");
    expect(frame).not.toContain("component_real");
    unmount();
  });
});
