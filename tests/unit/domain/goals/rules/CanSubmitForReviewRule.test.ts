/**
 * Tests for CanSubmitForReviewRule validation rule
 */

import { CanSubmitForReviewRule } from "../../../../../src/domain/goals/rules/CanSubmitForReviewRule";
import { GoalState } from "../../../../../src/domain/goals/Goal";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";

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

describe("CanSubmitForReviewRule", () => {
  it("should pass when status is submitted", () => {
    const rule = new CanSubmitForReviewRule();
    const state = createGoalState({ status: GoalStatus.SUBMITTED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail when status is doing", () => {
    const rule = new CanSubmitForReviewRule();
    const state = createGoalState({ status: GoalStatus.DOING });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal for review in doing status");
  });

  it("should fail when status is blocked", () => {
    const rule = new CanSubmitForReviewRule();
    const state = createGoalState({ status: GoalStatus.BLOCKED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal for review in blocked status");
  });

  it("should fail when status is to-do", () => {
    const rule = new CanSubmitForReviewRule();
    const state = createGoalState({ status: GoalStatus.TODO });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal for review in defined status");
  });

  it("should fail when status is paused", () => {
    const rule = new CanSubmitForReviewRule();
    const state = createGoalState({ status: GoalStatus.PAUSED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal for review in paused status");
  });

  it("should fail when status is completed", () => {
    const rule = new CanSubmitForReviewRule();
    const state = createGoalState({ status: GoalStatus.COMPLETED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal for review in done status");
  });

  it("should pass when status is in-review (idempotent re-entry)", () => {
    const rule = new CanSubmitForReviewRule();
    const state = createGoalState({ status: GoalStatus.INREVIEW });
    const result = rule.validate(state);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should fail when status is qualified", () => {
    const rule = new CanSubmitForReviewRule();
    const state = createGoalState({ status: GoalStatus.QUALIFIED });
    const result = rule.validate(state);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Cannot submit goal for review in approved status");
  });
});
