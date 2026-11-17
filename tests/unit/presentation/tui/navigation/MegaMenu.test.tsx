import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import { MegaMenu } from "../../../../../src/presentation/tui/navigation/MegaMenu.js";
import {
  MEGA_MENU_GOAL_STATUS_FILTERS,
  MEGA_MENU_SECTIONS,
} from "../../../../../src/presentation/tui/navigation/MegaMenuDefinitions.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("MegaMenu", () => {
  const defaultProps = {
    activeScreenIndex: 0,
    onScreenSelect: () => {},
    onClose: () => {},
    terminalWidth: 100,
  };

  describe("level 1 rendering", () => {
    it("renders all section labels", () => {
      const { lastFrame } = render(<MegaMenu {...defaultProps} />);
      for (const section of MEGA_MENU_SECTIONS) {
        expect(lastFrame()).toContain(section.label);
      }
    });

    it("does not render shortcut numbers in level 1", () => {
      const { lastFrame } = render(<MegaMenu {...defaultProps} />);
      const frame = lastFrame()!;
      expect(frame).not.toMatch(/▸ \d /);
    });

    it("renders a framed menu surface", () => {
      const { lastFrame } = render(<MegaMenu {...defaultProps} />);
      expect(lastFrame()).toContain("┌");
    });

    it("paints an opaque panel over underlying content", () => {
      const { lastFrame } = render(
        <Box width={100} flexDirection="column" position="relative">
          <Text>
            UNDERLYING CONTENT SHOULD NOT BLEED THROUGH THE MEGA MENU PANEL
          </Text>
          <Text>
            MORE UNDERLYING CONTENT SHOULD NOT BLEED THROUGH THE MENU COLUMNS
          </Text>
          <Box position="absolute" width="100%">
            <MegaMenu {...defaultProps} />
          </Box>
        </Box>,
      );

      expect(lastFrame()).toContain("Navigate");
      expect(lastFrame()).not.toContain("UNDERLYING CONTENT");
      expect(lastFrame()).not.toContain("MORE UNDERLYING CONTENT");
    });

    it("shows selector glyph on the highlighted section", () => {
      const { lastFrame } = render(<MegaMenu {...defaultProps} />);
      expect(lastFrame()).toContain("▸");
    });

    it("marks the active screen with brackets", () => {
      const { lastFrame } = render(
        <MegaMenu {...defaultProps} activeScreenIndex={1} />,
      );
      expect(lastFrame()).toContain("[Goals]");
    });

    it("does not bracket inactive screens", () => {
      const { lastFrame } = render(
        <MegaMenu {...defaultProps} activeScreenIndex={1} />,
      );
      expect(lastFrame()).not.toContain("[Cockpit]");
    });
  });

  describe("level 2 rendering", () => {
    it("does not render lower-level items for Cockpit", () => {
      const { lastFrame } = render(<MegaMenu {...defaultProps} />);

      expect(lastFrame()).not.toContain("Project Overview");
      expect(lastFrame()).not.toContain("Goal Summary");
    });

    it("renders level 2 items for Goals when highlighted", async () => {
      const { lastFrame, stdin } = render(<MegaMenu {...defaultProps} />);
      stdin.write("\x1B[B");
      await tick();
      const children = MEGA_MENU_SECTIONS[1].children;
      for (const child of children) {
        expect(lastFrame()).toContain(child.label);
      }
    });
  });

  describe("level 3 rendering", () => {
    it("renders level 3 items for the highlighted Goals item", async () => {
      const { lastFrame, stdin } = render(<MegaMenu {...defaultProps} />);
      stdin.write("\x1B[B");
      await tick();
      const level3Items = MEGA_MENU_SECTIONS[1].children[0].children!;
      for (const item of level3Items) {
        expect(lastFrame()).toContain(item.label);
      }
    });
  });

  describe("vertical navigation", () => {
    it("navigates down within level 1", async () => {
      const { lastFrame, stdin } = render(<MegaMenu {...defaultProps} />);
      stdin.write("\x1B[B");
      await tick();
      expect(lastFrame()).toContain("▸ Goals");
    });

    it("navigates up within level 1", async () => {
      const { lastFrame, stdin } = render(
        <MegaMenu {...defaultProps} activeScreenIndex={2} />,
      );
      stdin.write("\x1B[A");
      await tick();
      expect(lastFrame()).toContain("▸ Goals");
    });

    it("does not navigate up past the first item", async () => {
      const { lastFrame, stdin } = render(<MegaMenu {...defaultProps} />);
      stdin.write("\x1B[A");
      await tick();
      expect(lastFrame()).toContain("▸ [Cockpit]");
    });

    it("does not navigate down past the last item", async () => {
      const { lastFrame, stdin } = render(
        <MegaMenu
          {...defaultProps}
          activeScreenIndex={7}
        />,
      );
      stdin.write("\x1B[B");
      await tick();
      const lastSection = MEGA_MENU_SECTIONS[MEGA_MENU_SECTIONS.length - 1];
      expect(lastFrame()).toContain(`▸ [${lastSection.label}]`);
    });
  });

  describe("horizontal navigation", () => {
    it("drills into level 2 on right arrow", async () => {
      const { lastFrame, stdin } = render(
        <MegaMenu {...defaultProps} terminalWidth={120} />,
      );
      stdin.write("\x1B[B");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      const firstChild = MEGA_MENU_SECTIONS[1].children[0];
      expect(lastFrame()).toContain(`▸ ${firstChild.label}`);
    });

    it("drills into level 3 on second right arrow", async () => {
      const { lastFrame, stdin } = render(
        <MegaMenu {...defaultProps} terminalWidth={120} />,
      );
      stdin.write("\x1B[B");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      const firstGrandchild = MEGA_MENU_SECTIONS[1].children[0].children![0];
      expect(lastFrame()).toContain(`▸ ${firstGrandchild.label}`);
    });

    it("goes back to level 1 on left arrow from level 2", async () => {
      const { lastFrame, stdin } = render(
        <MegaMenu {...defaultProps} terminalWidth={120} />,
      );
      stdin.write("\x1B[B");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      stdin.write("\x1B[D");
      await tick();
      expect(lastFrame()).toContain("▸ Goals");
    });

    it("navigates vertically within level 2", async () => {
      const { lastFrame, stdin } = render(
        <MegaMenu {...defaultProps} terminalWidth={120} />,
      );
      stdin.write("\x1B[B");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      stdin.write("\x1B[B");
      await tick();
      const secondChild = MEGA_MENU_SECTIONS[1].children[1];
      expect(lastFrame()).toContain(`▸ ${secondChild.label}`);
    });
  });

  describe("selection", () => {
    it("selects screen on enter at level 1", async () => {
      const onScreenSelect = jest.fn();
      const { stdin } = render(
        <MegaMenu {...defaultProps} onScreenSelect={onScreenSelect} />,
      );
      stdin.write("\x1B[B");
      await tick();
      stdin.write("\r");
      await tick();
      expect(onScreenSelect).toHaveBeenCalledWith({ screenIndex: 1 });
    });

    it("selects a Goals group with its grouped status filter", async () => {
      const onScreenSelect = jest.fn();
      const { stdin } = render(
        <MegaMenu {...defaultProps} onScreenSelect={onScreenSelect} />,
      );

      stdin.write("\x1B[B");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      stdin.write("\r");
      await tick();

      expect(onScreenSelect).toHaveBeenCalledWith({
        screenIndex: 1,
        goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.backlog,
      });
    });

    it("selects a Goals leaf with its leaf status filter", async () => {
      const onScreenSelect = jest.fn();
      const { stdin } = render(
        <MegaMenu {...defaultProps} onScreenSelect={onScreenSelect} />,
      );

      stdin.write("\x1B[B");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      stdin.write("\x1B[B");
      await tick();
      stdin.write("\r");
      await tick();

      expect(onScreenSelect).toHaveBeenCalledWith({
        screenIndex: 1,
        goalStatusFilter: MEGA_MENU_GOAL_STATUS_FILTERS.refined,
      });
    });

    it("does not select Memory at level 1 and drills into entity pages instead", async () => {
      const onScreenSelect = jest.fn();
      const { lastFrame, stdin } = render(
        <MegaMenu
          {...defaultProps}
          onScreenSelect={onScreenSelect}
          terminalWidth={120}
        />,
      );

      stdin.write("\x1B[B");
      await tick();
      stdin.write("\x1B[B");
      await tick();
      stdin.write("\r");
      await tick();

      expect(onScreenSelect).not.toHaveBeenCalled();
      expect(lastFrame()).toContain("▸ Decisions");

      stdin.write("\r");
      await tick();

      expect(onScreenSelect).toHaveBeenCalledWith({ screenIndex: 2 });
    });

    it("does not respond to number key presses", () => {
      const onScreenSelect = jest.fn();
      const { stdin } = render(
        <MegaMenu {...defaultProps} onScreenSelect={onScreenSelect} />,
      );
      stdin.write("3");
      expect(onScreenSelect).not.toHaveBeenCalled();
    });
  });

  describe("closing", () => {
    it("closes on escape at level 1", async () => {
      const onClose = jest.fn();
      const { stdin } = render(
        <MegaMenu {...defaultProps} onClose={onClose} />,
      );
      stdin.write("\x1B");
      await tick();
      expect(onClose).toHaveBeenCalled();
    });

    it("goes back one level on escape at level 2 instead of closing", async () => {
      const onClose = jest.fn();
      const { lastFrame, stdin } = render(
        <MegaMenu {...defaultProps} onClose={onClose} terminalWidth={120} />,
      );
      stdin.write("\x1B[B");
      await tick();
      stdin.write("\x1B[C");
      await tick();
      const firstChild = MEGA_MENU_SECTIONS[1].children[0];
      expect(lastFrame()).toContain(`▸ ${firstChild.label}`);
      stdin.write("\x1B");
      await tick();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("keyboard hint area", () => {
    it("renders command key hints at level 1", () => {
      const { lastFrame } = render(<MegaMenu {...defaultProps} />);
      const frame = lastFrame()!;
      expect(frame).toContain("←→");
      expect(frame).toContain("esc");
    });

    it("keeps command key hints visible when drilled into a sublevel", async () => {
      const { lastFrame, stdin } = render(
        <MegaMenu {...defaultProps} terminalWidth={120} />,
      );
      stdin.write("\x1B[C");
      await tick();
      expect(lastFrame()).toContain("esc");
    });
  });

  describe("column separators", () => {
    it("renders vertical separator between columns", () => {
      const { lastFrame } = render(<MegaMenu {...defaultProps} />);
      expect(lastFrame()).toContain("│");
    });
  });
});
