import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import stripAnsi from "strip-ansi";
import { GlyphCellDaemonFrame } from "../../../../../src/presentation/tui/cockpit/GlyphCellDaemonFrame.js";
import { SubprocessStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";

const runningSnapshot = {
  status: SubprocessStatus.RUNNING,
  events: [],
} as const;

function line(text: string): readonly { readonly glyph: string; readonly color: string }[] {
  return [...text].map((glyph) => ({ glyph, color: "#111111" }));
}

describe("GlyphCellDaemonFrame", () => {
  it("renders glyph cell frames with the centered status label overlay", () => {
    const { lastFrame, unmount } = render(
      <GlyphCellDaemonFrame
        frame={[
          line("abcde"),
          line("fghij"),
          line("klmno"),
          line("pqrst"),
          line("uvwxy"),
          line("zzzzz"),
        ]}
        frameIndex={7}
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
