import { describe, expect, it } from "@jest/globals";
import * as IDaemonConstantsModule from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonConstants.js";
import type { IDaemonConstants } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonConstants.js";

describe("IDaemonConstants", () => {
  it("keeps daemon constants as a type-only presentation contract", () => {
    expect(Object.keys(IDaemonConstantsModule)).toEqual([]);
  });

  it("accepts daemon identity, status vocabulary, and info copy", () => {
    expect(daemonConstantsContract).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        title: expect.any(String),
        activeVerb: expect.any(String),
        idleVerb: expect.any(String),
        info: expect.objectContaining({
          title: expect.any(String),
          lines: expect.any(Array),
        }),
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
