import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { SessionScreen } from "../../../../../src/presentation/tui/sessions/SessionScreen.js";
import { StateReaderProvider } from "../../../../../src/presentation/tui/state-reading/StateReader.js";

async function waitForFrame(readFrame: () => string | undefined, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(text)) return frame;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFrame() ?? "";
}

describe("SessionScreen", () => {
  it("renders sessions from GetSessionsResponse", async () => {
    const { lastFrame, unmount } = render(
      <StateReaderProvider
        controllers={{
          getSessionsController: {
            handle: async () => ({
              sessions: [
                {
                  sessionId: "session_real",
                  focus: "Resolve rejected goal",
                  status: "active",
                  contextSnapshot: null,
                  version: 1,
                  startedAt: "2026-05-15T00:00:00.000Z",
                  endedAt: null,
                  createdAt: "2026-05-15T00:00:00.000Z",
                  updatedAt: "2026-05-15T00:00:00.000Z",
                },
              ],
            }),
          },
        }}
        options={{ tickMs: 0 }}
      >
        <SessionScreen />
      </StateReaderProvider>,
    );

    const frame = await waitForFrame(lastFrame, "session_real");

    expect(frame).toContain("session_real");
    expect(frame).toContain("active");
    expect(frame).toContain("Resolve rejected goal");
    unmount();
  });
});
