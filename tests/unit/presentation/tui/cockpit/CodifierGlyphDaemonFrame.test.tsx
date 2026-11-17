import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import stripAnsi from "strip-ansi";
import { BaseColors } from "../../../../../src/presentation/shared/DesignTokens.js";
import { CodifierGlyphDaemonFrame } from "../../../../../src/presentation/tui/cockpit/CodifierGlyphDaemonFrame.js";
import { SubprocessStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";

const runningSnapshot = {
  status: SubprocessStatus.RUNNING,
  events: [],
} as const;

describe("CodifierGlyphDaemonFrame", () => {
  it("renders codifier glyph text with the centered status label overlay", () => {
    const { lastFrame, unmount } = render(
      <CodifierGlyphDaemonFrame
        frame={["abcde", "fghij", "klmno", "pqrst", "uvwxy", "zzzzz"]}
        frameIndex={3}
        glyphColors={{
          a: BaseColors.shade1,
          k: BaseColors.shade2,
        }}
        snapshot={runningSnapshot}
        statusLabel="RUN"
      />,
    );

    const renderedLines = stripAnsi(lastFrame() ?? "").split("\n");

    expect(renderedLines).toHaveLength(5);
    expect(renderedLines[0]).toContain("abcde");
    expect(renderedLines[2]).toContain("kRUNo");
    expect(renderedLines).not.toContain("zzzzz");
    unmount();
  });
});
