import { describe, expect, it } from "@jest/globals";
import { BaseColors } from "../../../../../src/presentation/shared/DesignTokens.js";
import { DaemonFrameStatusColor } from "../../../../../src/presentation/tui/cockpit/DaemonFrameStatusColor.js";

describe("DaemonFrameStatusColor", () => {
  it("uses the cockpit daemon frame status color token", () => {
    expect(DaemonFrameStatusColor).toBe(BaseColors.shade3);
  });
});
