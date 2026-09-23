import { GoalState } from "../../../../../src/domain/goals/Goal";
import {
  GoalErrorMessages,
  GoalStatus,
  GoalStatusType,
  WAITING_STATES,
  formatErrorMessage,
} from "../../../../../src/domain/goals/Constants";
import { CanPostponeRule } from "../../../../../src/domain/goals/rules/CanPostponeRule";

function state(status: GoalStatusType): GoalState {
  return {
    id: "goal_test",
    title: "Test",
    objective: "Test postponement",
    successCriteria: ["It works"],
    scopeIn: [],
    scopeOut: [],
    status,
    version: 1,
    progress: [],
  };
}

describe("CanPostponeRule", () => {
  it("allows a defined goal", () => {
    expect(new CanPostponeRule().validate(state(GoalStatus.TODO))).toEqual({
      isValid: true,
      errors: [],
    });
  });

  it.each([...new Set(Object.values(GoalStatus))].filter((status) => status !== GoalStatus.TODO))(
    "rejects %s with the constant-backed domain error",
    (status) => {
      expect(new CanPostponeRule().validate(state(status))).toEqual({
        isValid: false,
        errors: [formatErrorMessage(GoalErrorMessages.CANNOT_POSTPONE_IN_STATUS, { status })],
      });
    }
  );

  it("classifies postponed as a waiting state", () => {
    expect(WAITING_STATES.has(GoalStatus.POSTPONED)).toBe(true);
  });
});
