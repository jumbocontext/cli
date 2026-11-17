import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { GuidelinesScreen } from "../../../../../../src/presentation/tui/memory/guidelines/GuidelinesScreen.js";
import { StateReaderProvider } from "../../../../../../src/presentation/tui/state-reading/StateReader.js";

async function waitForFrame(readFrame: () => string | undefined, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(text)) return frame;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFrame() ?? "";
}

describe("GuidelinesScreen", () => {
  it("renders a focused guideline list and selected detail", async () => {
    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{
          getGuidelinesController: {
            handle: async () => ({
              guidelines: [{
                guidelineId: "guideline_real",
                title: "Real guideline",
                category: "process",
                description: "Rendered from a response",
                rationale: "Keeps the route data-backed",
                examples: [],
                isRemoved: false,
                removedAt: null,
                removalReason: null,
                version: 1,
                createdAt: "2026-05-15T00:00:00.000Z",
                updatedAt: "2026-05-15T00:00:00.000Z",
              }],
            }),
          },
        }}
        options={{ tickMs: 0 }}
      >
        <GuidelinesScreen />
      </StateReaderProvider>,
    );
    const frame = await waitForFrame(lastFrame, "guideline_real");

    expect(frame).toContain("guideline_real");
    expect(frame).toContain("Real guideline");
    expect(frame).not.toContain("decision_real");
    unmount();
  });
});
