import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { BaseColors } from "../../../../../../src/presentation/shared/DesignTokens.js";
import { SubprocessStatus } from "../../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";
import type { IDaemonFrame } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonFrame.js";

const refinerFrame = [[{ glyph: "r", color: BaseColors.shade1 }]] as const;
const mockGetRefinerFrame = jest.fn(() => refinerFrame);
const mockGlyphCellDaemonFrame = jest.fn(() => <Text>REFINER_FRAME</Text>);

jest.unstable_mockModule(
  "../../../../../../src/presentation/tui/cockpit/CockpitDaemonFrames.js",
  () => ({
    getRefinerFrame: mockGetRefinerFrame,
  }),
);

jest.unstable_mockModule(
  "../../../../../../src/presentation/tui/cockpit/GlyphCellDaemonFrame.js",
  () => ({
    GlyphCellDaemonFrame: mockGlyphCellDaemonFrame,
  }),
);

const { RefinerDaemonFrame } = await import(
  "../../../../../../src/presentation/tui/cockpit/daemons/RefinerDaemonFrame.js"
);

const runningSnapshot = {
  status: SubprocessStatus.RUNNING,
  events: [],
} as const;

describe("RefinerDaemonFrame", () => {
  beforeEach(() => {
    mockGetRefinerFrame.mockClear();
    mockGlyphCellDaemonFrame.mockClear();
  });

  it("selects the refiner frame and passes glyph cell rendering inputs", () => {
    const refinerGlyphPalette = [BaseColors.shade1, BaseColors.shade2] as const;
    const props: IDaemonFrame = {
      frameIndex: 2,
      snapshot: runningSnapshot,
      statusLabel: "RUN",
      refinerGlyphPalette,
      reviewerGlyphPalette: [],
      codifierGlyphColors: {},
    };

    const { unmount } = render(<RefinerDaemonFrame {...props} />);

    expect(mockGlyphCellDaemonFrame).toHaveBeenCalledTimes(1);
    expect(mockGetRefinerFrame).toHaveBeenCalledWith(
      props.frameIndex,
      refinerGlyphPalette,
    );
    expect(mockGlyphCellDaemonFrame.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        frame: refinerFrame,
        frameIndex: props.frameIndex,
        snapshot: runningSnapshot,
        statusLabel: props.statusLabel,
      }),
    );
    unmount();
  });
});
