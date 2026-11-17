import { describe, expect, it } from "@jest/globals";
import {
  GoalAuthoringRequestStatus,
  GoalAuthoringResultCopy,
  GoalAuthoringResultInteractionKey,
} from "../../../../../src/presentation/tui/goals/GoalAuthoringFlowConstants.js";

describe("GoalAuthoringFlowConstants", () => {
  it("keeps request statuses stable", () => {
    expect(GoalAuthoringRequestStatus).toEqual({
      PENDING: "pending",
      SUCCESS: "success",
      FAILURE: "failure",
    });
  });

  it("keeps result interaction keys and their copy owner-local", () => {
    expect(GoalAuthoringResultInteractionKey).toEqual({
      ACKNOWLEDGE: "enter",
      CANCEL: "esc",
    });
    expect(GoalAuthoringResultCopy.acknowledge).toBeTruthy();
    expect(GoalAuthoringResultCopy.retry).toBeTruthy();
    expect(GoalAuthoringResultCopy.cancel).toBeTruthy();
  });
});
