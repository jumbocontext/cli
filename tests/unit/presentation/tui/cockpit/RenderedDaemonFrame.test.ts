import { describe, expect, it } from "@jest/globals";
import { SubprocessStatus } from "../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";
import { RenderedDaemonFrame } from "../../../../../src/presentation/tui/cockpit/RenderedDaemonFrame.js";

describe("RenderedDaemonFrame", () => {
  it("limits daemon frame rendering to the visible frame height", () => {
    expect(RenderedDaemonFrame.getFrame([0, 1, 2, 3, 4, 5, 6])).toEqual([
      0,
      1,
      2,
      3,
      4,
    ]);
  });
  
  it("uses animated frame indexes only while the daemon is running", () => {
    expect(RenderedDaemonFrame.getIndex({
      status: SubprocessStatus.RUNNING,
      events: [],
    }, 3)).toBe(3);
    expect(RenderedDaemonFrame.getIndex({
      status: SubprocessStatus.STOPPED,
      events: [],
    }, 3)).toBe(0);
  });
});
