import { describe, expect, it } from "@jest/globals";
import {
  MEGA_MENU_SECTIONS,
  MEGA_MENU_GOAL_STATUS_FILTERS,
  MAX_MENU_DEPTH,
} from "../../../../src/presentation/tui/navigation/MegaMenuDefinitions.js";
import { SCREEN_DEFINITIONS } from "../../../../src/presentation/tui/navigation/ScreenDefinitions.js";
import { GoalStatus } from "../../../../src/domain/goals/Constants.js";

describe("MegaMenuDefinitions", () => {
  it("defines top-level sections with Memory as a category", () => {
    expect(MEGA_MENU_SECTIONS).toHaveLength(4);
    const keys = MEGA_MENU_SECTIONS.map((s) => s.key);
    expect(keys).toEqual(["cockpit", "goals", "memory", "settings"]);
  });

  it("assigns sequential shortcut numbers", () => {
    const shortcuts = MEGA_MENU_SECTIONS.map((s) => s.shortcut);
    expect(shortcuts).toEqual(["1", "2", "3", "4"]);
  });

  it("keeps Cockpit and Settings as direct routes without lower levels", () => {
    expect(MEGA_MENU_SECTIONS[0]).toMatchObject({
      key: "cockpit",
      screenKey: "cockpit",
      children: [],
    });
    expect(MEGA_MENU_SECTIONS[3]).toMatchObject({
      key: "settings",
      screenKey: "settings",
      children: [],
    });
  });

  it("attaches grouped and leaf status filters to Goals menu entries", () => {
    const goalsSection = MEGA_MENU_SECTIONS[1];

    expect(goalsSection.screenKey).toBe("goals");
    expect(goalsSection.children.map((child) => child.goalStatusFilter)).toEqual([
      MEGA_MENU_GOAL_STATUS_FILTERS.backlog,
      MEGA_MENU_GOAL_STATUS_FILTERS.active,
      MEGA_MENU_GOAL_STATUS_FILTERS.archive,
    ]);
    expect(goalsSection.children[0].children?.map((item) => item.goalStatusFilter)).toEqual([
      MEGA_MENU_GOAL_STATUS_FILTERS.defined,
      MEGA_MENU_GOAL_STATUS_FILTERS.refined,
      MEGA_MENU_GOAL_STATUS_FILTERS.postponed,
    ]);
    expect(goalsSection.children[1].children?.map((item) => item.goalStatusFilter)).toEqual([
      MEGA_MENU_GOAL_STATUS_FILTERS.doing,
      MEGA_MENU_GOAL_STATUS_FILTERS.blocked,
      MEGA_MENU_GOAL_STATUS_FILTERS.inReview,
    ]);
    expect(goalsSection.children[2].children?.[0].goalStatusFilter).toEqual(
      MEGA_MENU_GOAL_STATUS_FILTERS.done,
    );
  });

  it("links Memory submenu items to dedicated entity screens", () => {
    const memorySection = MEGA_MENU_SECTIONS.find(
      (section) => section.key === "memory",
    );

    expect(memorySection?.screenKey).toBeUndefined();
    expect(memorySection?.children.map((child) => child.screenKey)).toEqual([
      "decisions",
      "invariants",
      "components",
      "dependencies",
      "guidelines",
    ]);
  });

  it("does not define third-level Memory items", () => {
    const memorySection = MEGA_MENU_SECTIONS.find(
      (section) => section.key === "memory",
    );

    expect(memorySection?.children.every((child) => child.children === undefined)).toBe(
      true,
    );
  });

  it("only references screen keys defined by the screen router table", () => {
    const screenKeys = new Set(SCREEN_DEFINITIONS.map((screen) => screen.key));
    const menuScreenKeys = MEGA_MENU_SECTIONS.flatMap((section) => [
      ...(section.screenKey === undefined ? [] : [section.screenKey]),
      ...section.children.flatMap((child) => [
        ...(child.screenKey === undefined ? [] : [child.screenKey]),
        ...(child.children ?? []).flatMap((grandchild) =>
          grandchild.screenKey === undefined ? [] : [grandchild.screenKey],
        ),
      ]),
    ]);

    expect(menuScreenKeys.length).toBeGreaterThan(0);
    expect(menuScreenKeys.every((screenKey) => screenKeys.has(screenKey))).toBe(
      true,
    );
  });

  it("sets max menu depth to 3", () => {
    expect(MAX_MENU_DEPTH).toBe(3);
  });

  it("uses domain constants for goal status submenu keys", () => {
    const goalsSection = MEGA_MENU_SECTIONS[1];

    expect(goalsSection.children[0].children?.map((item) => item.key)).toEqual([
      GoalStatus.TODO,
      GoalStatus.REFINED,
      GoalStatus.POSTPONED,
    ]);
    expect(goalsSection.children[1].children?.map((item) => item.key)).toEqual([
      GoalStatus.DOING,
      GoalStatus.BLOCKED,
      GoalStatus.INREVIEW,
    ]);
    expect(goalsSection.children[2].children?.[0].key).toBe(GoalStatus.DONE);
  });

  it("all items have unique keys within their level", () => {
    const sectionKeys = MEGA_MENU_SECTIONS.map((s) => s.key);
    expect(new Set(sectionKeys).size).toBe(sectionKeys.length);

    for (const section of MEGA_MENU_SECTIONS) {
      const childKeys = section.children.map((c) => c.key);
      expect(new Set(childKeys).size).toBe(childKeys.length);
    }
  });
});
