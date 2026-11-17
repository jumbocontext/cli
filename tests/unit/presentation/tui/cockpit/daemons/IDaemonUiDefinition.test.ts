import { describe, expect, it } from "@jest/globals";
import React from "react";
import * as IDaemonUiDefinitionModule from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonUiDefinition.js";
import type { IDaemonConstants } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonConstants.js";
import type { IDaemonFrame } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonFrame.js";
import type { IDaemonUiDefinition } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonUiDefinition.js";

describe("IDaemonUiDefinition", () => {
  it("keeps daemon UI definition as a type-only presentation contract", () => {
    expect(Object.keys(IDaemonUiDefinitionModule)).toEqual([]);
  });

  it("accepts paired daemon constants and frame renderer contracts", () => {
    expect(daemonUiDefinitionContract).toEqual(
      expect.objectContaining({
        constants: daemonConstantsContract,
        Frame: expect.any(Function),
      }),
    );
  });

  it("accepts frame renderers that consume daemon frame presentation data", () => {
    const frameElement = daemonUiDefinitionContract.Frame(daemonFrameContract);

    expect(React.isValidElement(frameElement)).toBe(true);
    expect(frameElement.props).toEqual(
      expect.objectContaining({
        frameIndex: daemonFrameContract.frameIndex,
        statusLabel: daemonFrameContract.statusLabel,
      }),
    );
  });
});

const daemonConstantsContract: IDaemonConstants = {
  name: "reviewer",
  title: "Reviewer daemon",
  activeVerb: "reviewing",
  idleVerb: "awaiting submissions",
  info: {
    title: "Reviewer daemon",
    lines: ["Reviews completed goal implementations."],
  },
};

const daemonFrameContract: IDaemonFrame = {
  frameIndex: 2,
  snapshot: {
    status: "running",
    events: [],
  },
  statusLabel: "RUNNING",
  refinerGlyphPalette: ["#111111", "#222222"],
  reviewerGlyphPalette: ["#333333", "#444444"],
  codifierGlyphColors: {
    A: "#555555",
  },
};

const daemonUiDefinitionContract: IDaemonUiDefinition = {
  constants: daemonConstantsContract,
  Frame: (frame) =>
    React.createElement("mock-daemon-frame", {
      frameIndex: frame.frameIndex,
      statusLabel: frame.statusLabel,
    }),
};
