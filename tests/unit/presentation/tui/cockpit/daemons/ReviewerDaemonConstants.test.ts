import { describe, expect, it } from "@jest/globals";
import { ReviewerDaemonConstants } from "../../../../../../src/presentation/tui/cockpit/daemons/ReviewerDaemonConstants.js";
import type { IDaemonConstants } from "../../../../../../src/presentation/tui/cockpit/daemons/IDaemonConstants.js";
import * as ReviewerDaemonConstantsModule from "../../../../../../src/presentation/tui/cockpit/daemons/ReviewerDaemonConstants.js";

describe("ReviewerDaemonConstants", () => {
  it("exports only the reviewer daemon constants concept", () => {
    expect(Object.keys(ReviewerDaemonConstantsModule)).toEqual([
      "ReviewerDaemonConstants",
    ]);
  });

  it("provides the daemon identity and status verbs", () => {
    expect(ReviewerDaemonConstants).toEqual(
      expect.objectContaining({
        name: "reviewer",
        title: expect.any(String),
        activeVerb: expect.any(String),
        idleVerb: expect.any(String),
      }),
    );
  });

  it("provides structured daemon info copy", () => {
    expect(ReviewerDaemonConstants.info).toEqual(
      expect.objectContaining({
        title: ReviewerDaemonConstants.title,
        lines: expect.any(Array),
      }),
    );
    expect(ReviewerDaemonConstants.info.lines.length).toBeGreaterThan(0);
    expect(
      ReviewerDaemonConstants.info.lines.some((line) => line.length > 0),
    ).toBe(true);
  });
});

const reviewerDaemonConstantsContract: IDaemonConstants =
  ReviewerDaemonConstants;

void reviewerDaemonConstantsContract;
