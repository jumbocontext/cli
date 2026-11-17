import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { ScreenRouter } from "../../../../../src/presentation/tui/navigation/ScreenRouter.js";
import { MEGA_MENU_SECTIONS } from "../../../../../src/presentation/tui/navigation/MegaMenuDefinitions.js";
import { SCREEN_DEFINITIONS } from "../../../../../src/presentation/tui/navigation/ScreenDefinitions.js";

const frameAt = (i: number) => {
  const { lastFrame, unmount } = render(<ScreenRouter activeScreenIndex={i} />);
  const frame = lastFrame()!;
  unmount();
  return frame;
};

describe("ScreenRouter", () => {
  it("renders distinct output for each screen index", () => {
    const frames = [0, 1, 2, 3, 4, 5, 6, 7].map(frameAt);
    const unique = new Set(frames);
    expect(unique.size).toBe(frames.length);
  });

  it("falls back to index 0 for out-of-bounds index", () => {
    expect(frameAt(99)).toBe(frameAt(0));
  });

  it("renders every screen key selectable from the MegaMenu", () => {
    const routableMenuKeys = MEGA_MENU_SECTIONS.flatMap((section) => [
      ...(section.screenKey === undefined ? [] : [section.screenKey]),
      ...section.children.flatMap((child) => [
        ...(child.screenKey === undefined ? [] : [child.screenKey]),
        ...(child.children ?? []).flatMap((grandchild) =>
          grandchild.screenKey === undefined ? [] : [grandchild.screenKey],
        ),
      ]),
    ]);

    for (const screenKey of routableMenuKeys) {
      const screenIndex = SCREEN_DEFINITIONS.findIndex(
        (screen) => screen.key === screenKey,
      );

      expect(screenIndex).toBeGreaterThanOrEqual(0);
      expect(frameAt(screenIndex).trim().length).toBeGreaterThan(0);
    }
  });
});
