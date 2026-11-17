import { describe, expect, it } from "@jest/globals";
import { CockpitDaemonPanelCopy } from "../../../../../src/presentation/tui/cockpit/CockpitDaemonPanelCopy.js";

describe("CockpitDaemonPanelCopy", () => {
  it("keeps daemon panel action and overlay labels grouped together", () => {
    expect(CockpitDaemonPanelCopy.closeInfoLabel.length).toBeGreaterThan(0);
    expect(CockpitDaemonPanelCopy.pidLabel.length).toBeGreaterThan(0);
  });
});
