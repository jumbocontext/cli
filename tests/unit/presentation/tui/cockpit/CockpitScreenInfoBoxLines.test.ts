import { describe, expect, it } from "@jest/globals";
import { CockpitScreenCopy } from "../../../../../src/presentation/tui/cockpit/CockpitScreenCopy.js";
import { getCockpitScreenInfoBoxLines } from "../../../../../src/presentation/tui/cockpit/CockpitScreenInfoBoxLines.js";

describe("getCockpitScreenInfoBoxLines", () => {
  it("builds uninitialized banner info lines from directory and status data", () => {
    const lines = getCockpitScreenInfoBoxLines("uninitialized", "C:\\workspace");

    expect(lines).toHaveLength(5);
    expect(lines?.join("\n")).toContain(CockpitScreenCopy.directoryLabel);
    expect(lines?.join("\n")).toContain(CockpitScreenCopy.uninitializedStatus);
  });

  it("builds unprimed banner info lines from directory and status data", () => {
    const lines = getCockpitScreenInfoBoxLines("unprimed", "C:\\workspace");

    expect(lines).toHaveLength(5);
    expect(lines?.join("\n")).toContain(CockpitScreenCopy.directoryLabel);
    expect(lines?.join("\n")).toContain(CockpitScreenCopy.readyStatus);
  });

  it.each(["primed-empty", "primed"] as const)(
    "omits banner info lines for state=%s",
    (state) => {
      expect(getCockpitScreenInfoBoxLines(state, "C:\\workspace")).toBeUndefined();
    },
  );
});
