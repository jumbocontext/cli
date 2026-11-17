/**
 * Tests for CanRejectRule validation rule
 */

import { CanRejectRule } from "../../../../../../src/domain/goals/rules/CanRejectRule";
import { GoalState } from "../../../../../../src/domain/goals/Goal";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";

// Helper to create a minimal GoalState for testing
function createGoalState(overrides: Partial<GoalState> = {}): GoalState {
  return {
    id: "goal_test123",
    title: "Test goal",
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

describe("CanRejectRule", () => {
  it("should pass when status is in-review", () => {
    const rule = new CanRejectRule();
    const state = createGoalState({ status: GoalStatus.INREVIEW });
    const result = rule.validate(state);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail when status is to-do", () => {
    const rule = new CanRejectRule();
    const state = createGoalState({ status: GoalStatus.TODO });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot reject goal in defined status");
  });

  it("should fail when status is doing", () => {
    const rule = new CanRejectRule();
    const state = createGoalState({ status: GoalStatus.DOING });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot reject goal in doing status");
  });

  it("should fail when status is blocked", () => {
    const rule = new CanRejectRule();
    const state = createGoalState({ status: GoalStatus.BLOCKED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot reject goal in blocked status");
  });

  it("should fail when status is refined", () => {
    const rule = new CanRejectRule();
    const state = createGoalState({ status: GoalStatus.REFINED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot reject goal in refined status");
  });

  it("should fail when status is qualified", () => {
    const rule = new CanRejectRule();
    const state = createGoalState({ status: GoalStatus.QUALIFIED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot reject goal in approved status");
  });

  it("should fail when status is completed", () => {
    const rule = new CanRejectRule();
    const state = createGoalState({ status: GoalStatus.COMPLETED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot reject goal in done status");
  });
});
