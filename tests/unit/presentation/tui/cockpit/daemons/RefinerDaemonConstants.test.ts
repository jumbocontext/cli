import { describe, expect, it } from "@jest/globals";
import { RefinerDaemonConstants } from "../../../../../../src/presentation/tui/cockpit/daemons/RefinerDaemonConstants.js";
import type { IDaemonConstants } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonConstants.js";
import * as RefinerDaemonConstantsModule from "../../../../../../src/presentation/tui/cockpit/daemons/RefinerDaemonConstants.js";

describe("RefinerDaemonConstants", () => {
  it("exports only the refiner daemon constants concept", () => {
    expect(Object.keys(RefinerDaemonConstantsModule)).toEqual([
      "RefinerDaemonConstants",
    ]);
  });

  it("provides the daemon identity and status verbs", () => {
    expect(RefinerDaemonConstants).toEqual(
      expect.objectContaining({
        name: "refiner",
        title: expect.any(String),
        activeVerb: expect.any(String),
        idleVerb: expect.any(String),
      }),
    );
  });

  it("provides structured daemon info copy", () => {
    expect(RefinerDaemonConstants.info).toEqual(
      expect.objectContaining({
        title: RefinerDaemonConstants.title,
        lines: expect.any(Array),
      }),
    );
    expect(RefinerDaemonConstants.info.lines.length).toBeGreaterThan(0);
    expect(
      RefinerDaemonConstants.info.lines.some((line) => line.length > 0),
    ).toBe(true);
  });
});

const refinerDaemonConstantsContract: IDaemonConstants =
  RefinerDaemonConstants;

void refinerDaemonConstantsContract;
