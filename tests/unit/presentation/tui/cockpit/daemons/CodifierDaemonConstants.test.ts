import { describe, expect, it } from "@jest/globals";
import { CodifierDaemonConstants } from "../../../../../../src/presentation/tui/cockpit/daemons/CodifierDaemonConstants.js";
import type { IDaemonConstants } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonConstants.js";
import * as CodifierDaemonConstantsModule from "../../../../../../src/presentation/tui/cockpit/daemons/CodifierDaemonConstants.js";

describe("CodifierDaemonConstants", () => {
  it("exports only the codifier daemon constants concept", () => {
    expect(Object.keys(CodifierDaemonConstantsModule)).toEqual([
      "CodifierDaemonConstants",
    ]);
  });

  it("provides the daemon identity and status verbs", () => {
    expect(CodifierDaemonConstants).toEqual(
      expect.objectContaining({
        name: "codifier",
        title: expect.any(String),
        activeVerb: expect.any(String),
        idleVerb: expect.any(String),
      }),
    );
  });

  it("provides structured daemon info copy", () => {
    expect(CodifierDaemonConstants.info).toEqual(
      expect.objectContaining({
        title: CodifierDaemonConstants.title,
        lines: expect.any(Array),
      }),
    );
    expect(CodifierDaemonConstants.info.lines.length).toBeGreaterThan(0);
    expect(
      CodifierDaemonConstants.info.lines.some((line) => line.length > 0),
    ).toBe(true);
  });
});

const codifierDaemonConstantsContract: IDaemonConstants =
  CodifierDaemonConstants;

void codifierDaemonConstantsContract;
