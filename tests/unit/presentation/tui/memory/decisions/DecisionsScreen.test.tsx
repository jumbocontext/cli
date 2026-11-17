import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { DecisionsScreen } from "../../../../../../src/presentation/tui/memory/decisions/DecisionsScreen.js";
import { StateReaderProvider } from "../../../../../../src/presentation/tui/state-reading/StateReader.js";

async function waitForFrame(readFrame: () => string | undefined, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(text)) return frame;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFrame() ?? "";
}

describe("DecisionsScreen", () => {
  it("renders a focused decision list and selected detail", async () => {
    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{
          getDecisionsController: {
            handle: async () => ({
              decisions: [{
                decisionId: "decision_real",
                title: "Real decision",
                context: "Rendered from a response",
                rationale: "Keeps the route data-backed",
                alternatives: [],
                consequences: null,
                status: "active",
                supersededBy: null,
                reversalReason: null,
                reversedAt: null,
                version: 1,
                createdAt: "2026-05-15T00:00:00.000Z",
                updatedAt: "2026-05-15T00:00:00.000Z",
              }],
            }),
          },
        }}
        options={{ tickMs: 0 }}
      >
        <DecisionsScreen />
      </StateReaderProvider>,
    );
    const frame = await waitForFrame(lastFrame, "decision_real");

    expect(frame).toContain("decision_real");
    expect(frame).toContain("Real decision");
    expect(frame).not.toContain("invariant_real");
    unmount();
  });
});
