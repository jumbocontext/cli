import { describe, expect, it } from "@jest/globals";
import {
  SCREEN_DEFINITIONS,
  DEFAULT_SCREEN_INDEX,
} from "../../../../../src/presentation/tui/navigation/ScreenDefinitions.js";

describe("ScreenDefinitions", () => {
  it("defines dedicated navigation screens", () => {
    expect(SCREEN_DEFINITIONS.map((screen) => screen.key)).toEqual([
      "cockpit",
      "goals",
      "decisions",
      "invariants",
      "components",
      "dependencies",
      "guidelines",
      "settings",
    ]);
  });

  it("assigns unique shortcut keys", () => {
    const shortcuts = SCREEN_DEFINITIONS.map((s) => s.shortcut);
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });

  it("assigns unique keys", () => {
    const keys = SCREEN_DEFINITIONS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("defaults to the first screen", () => {
    expect(DEFAULT_SCREEN_INDEX).toBe(0);
  });
});
