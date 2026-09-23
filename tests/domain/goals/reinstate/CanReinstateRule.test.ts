import { GoalState } from "../../../../src/domain/goals/Goal";
import {
  GoalErrorMessages,
  GoalStatus,
  GoalStatusType,
  formatErrorMessage,
} from "../../../../src/domain/goals/Constants";
import { CanReinstateRule } from "../../../../src/domain/goals/rules/CanReinstateRule";

function state(status: GoalStatusType): GoalState {
  return {
    id: "goal_test",
    title: "Test",
    objective: "Test reinstatement",
    successCriteria: ["It works"],
    scopeIn: [],
    scopeOut: [],
    status,
    version: 2,
    progress: [],
  };
}

describe("CanReinstateRule", () => {
  it("allows a postponed goal", () => {
    expect(new CanReinstateRule().validate(state(GoalStatus.POSTPONED))).toEqual({
      isValid: true,
      errors: [],
    });
  });

  it.each([...new Set(Object.values(GoalStatus))].filter((status) => status !== GoalStatus.POSTPONED))(
    "rejects %s with the constant-backed domain error",
    (status) => {
      expect(new CanReinstateRule().validate(state(status))).toEqual({
        isValid: false,
        errors: [formatErrorMessage(GoalErrorMessages.CANNOT_REINSTATE_IN_STATUS, { status })],
      });
    }
  );
});
