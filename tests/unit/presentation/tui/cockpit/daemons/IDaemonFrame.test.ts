import { describe, expect, it } from "@jest/globals";
import * as IDaemonFrameModule from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonFrame.js";
import type { IDaemonFrame } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonFrame.js";

describe("IDaemonFrame", () => {
  it("keeps daemon frame props as a type-only presentation contract", () => {
    expect(Object.keys(IDaemonFrameModule)).toEqual([]);
  });

  it("accepts daemon frame animation, snapshot, status, and glyph data", () => {
    expect(daemonFrameContract).toEqual(
      expect.objectContaining({
        frameIndex: expect.any(Number),
        snapshot: expect.objectContaining({
          status: expect.any(String),
          events: expect.any(Array),
        }),
        statusLabel: expect.any(String),
        refinerGlyphPalette: expect.any(Array),
        reviewerGlyphPalette: expect.any(Array),
        codifierGlyphColors: expect.objectContaining({
          A: expect.any(String),
        }),
      }),
    );
  });
});

const daemonFrameContract: IDaemonFrame = {
  frameIndex: 2,
  snapshot: {
    status: "running",
    events: [],
  },
  statusLabel: "RUNNING",
  refinerGlyphPalette: ["#111111", "#222222"],
  reviewerGlyphPalette: ["#333333", "#444444"],
  codifierGlyphColors: {
    A: "#555555",
  },
};
