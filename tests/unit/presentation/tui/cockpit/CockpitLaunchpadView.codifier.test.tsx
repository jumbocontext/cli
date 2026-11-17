import { describe, expect, it } from "@jest/globals";
import { getCodifierFrame } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonFrames.js";

describe("getCodifierFrame", () => {
  it("renders 10 rows of 35 characters", () => {
    const frame = getCodifierFrame(0);

    expect(frame).toHaveLength(10);
    for (const line of frame) {
      expect(line).toHaveLength(35);
    }
  });

  it("is deterministic per frame index and varies across frames", () => {
    const firstFrame = getCodifierFrame(0);
    const repeatedFrame = getCodifierFrame(0);
    const nextFrame = getCodifierFrame(1);

    expect(repeatedFrame).toEqual(firstFrame);
    expect(nextFrame).not.toEqual(firstFrame);
  });
});
