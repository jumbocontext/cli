/**
 * Tests for CanQualifyRule validation rule
 */

import { CanQualifyRule } from "../../../../../../src/domain/goals/rules/CanQualifyRule";
import { GoalState } from "../../../../../../src/domain/goals/Goal";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";

// Helper to create a minimal GoalState for testing
function createGoalState(overrides: Partial<GoalState> = {}): GoalState {
  return {
    id: "goal_test123",
    objective: "Test objective",
    successCriteria: ["Test criterion"],
    scopeIn: [],
    scopeOut: [],
    
    status: GoalStatus.TODO,
    version: 0,
    progress: [],
    ...overrides,
  };
}

describe("CanQualifyRule", () => {
  it("should pass when status is in-review", () => {
    const rule = new CanQualifyRule();
    const state = createGoalState({ status: GoalStatus.INREVIEW });
    const result = rule.validate(state);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail when status is to-do", () => {
    const rule = new CanQualifyRule();
    const state = createGoalState({ status: GoalStatus.TODO });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot approve goal in defined status");
  });

  it("should fail when status is doing", () => {
    const rule = new CanQualifyRule();
    const state = createGoalState({ status: GoalStatus.DOING });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot approve goal in doing status");
  });

  it("should fail when status is blocked", () => {
    const rule = new CanQualifyRule();
    const state = createGoalState({ status: GoalStatus.BLOCKED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot approve goal in blocked status");
  });

  it("should fail when status is paused", () => {
    const rule = new CanQualifyRule();
    const state = createGoalState({ status: GoalStatus.PAUSED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot approve goal in paused status");
  });

  it("should fail when status is completed", () => {
    const rule = new CanQualifyRule();
    const state = createGoalState({ status: GoalStatus.COMPLETED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot approve goal in done status");
  });

  it("should fail when status is qualified", () => {
    const rule = new CanQualifyRule();
    const state = createGoalState({ status: GoalStatus.QUALIFIED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot approve goal in approved status");
  });
});
