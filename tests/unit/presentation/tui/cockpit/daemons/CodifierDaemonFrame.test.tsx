import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { BaseColors } from "../../../../../../src/presentation/shared/DesignTokens.js";
import { SubprocessStatus } from "../../../../../../src/presentation/tui/daemon-subprocesses/SubprocessStatus.js";
import type { IDaemonFrame } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonFrame.js";

const codifierFrame = ["abcde", "fghij", "klmno"] as const;
const mockGetCodifierFrame = jest.fn(() => codifierFrame);
const mockCodifierGlyphDaemonFrame = jest.fn(() => (
  <Text>CODIFIER_FRAME</Text>
));

jest.unstable_mockModule(
  "../../../../../../src/presentation/tui/cockpit/CockpitDaemonFrames.js",
  () => ({
    getCodifierFrame: mockGetCodifierFrame,
  }),
);

jest.unstable_mockModule(
  "../../../../../../src/presentation/tui/cockpit/CodifierGlyphDaemonFrame.js",
  () => ({
    CodifierGlyphDaemonFrame: mockCodifierGlyphDaemonFrame,
  }),
);

const { CodifierDaemonFrame } = await import(
  "../../../../../../src/presentation/tui/cockpit/daemons/CodifierDaemonFrame.js"
);

const runningSnapshot = {
  status: SubprocessStatus.RUNNING,
  events: [],
} as const;

describe("CodifierDaemonFrame", () => {
  beforeEach(() => {
    mockGetCodifierFrame.mockClear();
    mockCodifierGlyphDaemonFrame.mockClear();
  });

  it("selects the codifier frame and passes codifier rendering inputs", () => {
    const codifierGlyphColors = {
      a: BaseColors.shade1,
      k: BaseColors.shade2,
    };
    const props: IDaemonFrame = {
      frameIndex: 3,
      snapshot: runningSnapshot,
      statusLabel: "RUN",
      refinerGlyphPalette: [],
      reviewerGlyphPalette: [],
      codifierGlyphColors,
    };

    const { unmount } = render(<CodifierDaemonFrame {...props} />);

    expect(mockCodifierGlyphDaemonFrame).toHaveBeenCalledTimes(1);
    expect(mockGetCodifierFrame).toHaveBeenCalledWith(props.frameIndex);
    expect(mockCodifierGlyphDaemonFrame.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        frame: codifierFrame,
        frameIndex: props.frameIndex,
        glyphColors: codifierGlyphColors,
        snapshot: runningSnapshot,
        statusLabel: props.statusLabel,
      }),
    );
    unmount();
  });
});
