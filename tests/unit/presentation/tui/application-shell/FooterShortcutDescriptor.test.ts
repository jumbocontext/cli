import { describe, expect, it } from "@jest/globals";
import {
  FooterShortcut,
  type FooterContextualShortcutDescriptor,
} from "../../../../../src/presentation/tui/application-shell/FooterShortcutDescriptor.js";

describe("FooterShortcutDescriptor", () => {
  it("defines the quit shortcut descriptor", () => {
    expect(FooterShortcut.QUIT).toEqual({ char: "q", label: "quit" });
  });

  it("defines the notification drawer shortcut descriptor", () => {
    expect(FooterShortcut.NOTIFICATIONS).toEqual({ char: "i" });
  });

  it("defines the MegaMenu shortcut descriptor", () => {
    expect(FooterShortcut.MEGA_MENU).toEqual({ char: "m", label: "menu" });
  });

  it("models contextual shortcuts as shortcuts with labels", () => {
    const contextualShortcut: FooterContextualShortcutDescriptor = {
      char: "g",
      label: "create goal",
    };

    expect(contextualShortcut.char).toBe("g");
    expect(contextualShortcut.label).toBe("create goal");
  });
});
