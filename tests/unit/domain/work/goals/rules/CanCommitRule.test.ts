/**
 * Tests for CanCommitRule validation rule
 */

import { CanCommitRule } from "../../../../../../src/domain/goals/rules/CanCommitRule";
import { GoalState } from "../../../../../../src/domain/goals/Goal";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";

// Helper to create a minimal GoalState for testing
function createGoalState(overrides: Partial<GoalState> = {}): GoalState {
  return {
    id: "goal_test123",
    title: "Test title",
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

describe("CanCommitRule", () => {
  it("should pass when status is in-refinement", () => {
    const rule = new CanCommitRule();
    const state = createGoalState({ status: GoalStatus.IN_REFINEMENT });
    const result = rule.validate(state);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail when status is to-do", () => {
    const rule = new CanCommitRule();
    const state = createGoalState({ status: GoalStatus.TODO });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot commit goal in defined status");
  });

  it("should fail when status is doing", () => {
    const rule = new CanCommitRule();
    const state = createGoalState({ status: GoalStatus.DOING });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot commit goal in doing status");
  });

  it("should fail when status is blocked", () => {
    const rule = new CanCommitRule();
    const state = createGoalState({ status: GoalStatus.BLOCKED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot commit goal in blocked status");
  });

  it("should fail when status is paused", () => {
    const rule = new CanCommitRule();
    const state = createGoalState({ status: GoalStatus.PAUSED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot commit goal in paused status");
  });

  it("should fail when status is completed", () => {
    const rule = new CanCommitRule();
    const state = createGoalState({ status: GoalStatus.COMPLETED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot commit goal in done status");
  });

  it("should fail when status is qualified", () => {
    const rule = new CanCommitRule();
    const state = createGoalState({ status: GoalStatus.QUALIFIED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot commit goal in approved status");
  });

  it("should fail when status is refined", () => {
    const rule = new CanCommitRule();
    const state = createGoalState({ status: GoalStatus.REFINED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot commit goal in refined status");
  });
});
