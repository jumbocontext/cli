import { describe, expect, it } from "@jest/globals";
import { DaemonFrameDimensions } from "../../../../../src/presentation/tui/cockpit/DaemonFrameDimensions.js";

describe("DaemonFrameDimensions", () => {
  it("defines stable daemon frame layout and animation dimensions", () => {
    expect(DaemonFrameDimensions.renderedFrameHeight).toBe(5);
    expect(DaemonFrameDimensions.panelContentWidth).toBe(35);
    expect(DaemonFrameDimensions.randomGlyphGridHeight).toBe(10);
    expect(DaemonFrameDimensions.codifierGridHeight).toBe(10);
  });

  it("defines stable frame counts and durations for each daemon", () => {
    expect(DaemonFrameDimensions.refinerFrameCount).toBe(9);
    expect(DaemonFrameDimensions.reviewerFrameCount).toBe(6);
    expect(DaemonFrameDimensions.codifierFrameCount).toBe(6);
    expect(DaemonFrameDimensions.defaultRefinerFrameDurationMs).toBe(500);
    expect(DaemonFrameDimensions.defaultReviewerFrameDurationMs).toBe(350);
    expect(DaemonFrameDimensions.defaultCodifierFrameDurationMs).toBe(200);
  });
});
