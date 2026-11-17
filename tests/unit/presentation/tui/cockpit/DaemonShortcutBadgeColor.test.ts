import { describe, expect, it } from "@jest/globals";
import { BaseColors } from "../../../../../src/presentation/shared/DesignTokens.js";
import { getDaemonShortcutBadgeColor } from "../../../../../src/presentation/tui/cockpit/DaemonShortcutBadgeColor.js";

describe("getDaemonShortcutBadgeColor", () => {
  it("returns active and inactive daemon shortcut colors", () => {
    expect(getDaemonShortcutBadgeColor(true)).toBe(BaseColors.brandBlue);
    expect(getDaemonShortcutBadgeColor(false)).toBe(BaseColors.shade4);
  });
});
