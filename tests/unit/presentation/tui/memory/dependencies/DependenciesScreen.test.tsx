import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { DependenciesScreen } from "../../../../../../src/presentation/tui/memory/dependencies/DependenciesScreen.js";
import { StateReaderProvider } from "../../../../../../src/presentation/tui/state-reading/StateReader.js";

async function waitForFrame(readFrame: () => string | undefined, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(text)) return frame;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFrame() ?? "";
}

describe("DependenciesScreen", () => {
  it("renders a focused dependency list and selected detail", async () => {
    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{
          getDependenciesController: {
            handle: async () => ({
              dependencies: [{
                dependencyId: "dependency_real",
                name: "Real dependency",
                ecosystem: "npm",
                packageName: "real-dependency",
                versionConstraint: "^1.0.0",
                endpoint: null,
                contract: "Rendered from a response",
                status: "active",
                version: 1,
                createdAt: "2026-05-15T00:00:00.000Z",
                updatedAt: "2026-05-15T00:00:00.000Z",
                removedAt: null,
                removalReason: null,
              }],
            }),
          },
        }}
        options={{ tickMs: 0 }}
      >
        <DependenciesScreen />
      </StateReaderProvider>,
    );
    const frame = await waitForFrame(lastFrame, "dependency_real");

    expect(frame).toContain("dependency_real");
    expect(frame).toContain("real-dependency");
    expect(frame).not.toContain("guideline_real");
    unmount();
  });
});
