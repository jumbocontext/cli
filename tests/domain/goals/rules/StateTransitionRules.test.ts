/**
 * Tests for State Transition validation rules
 */

import {
  CanAddRule,
  CanRefineRule,
  CanStartRule,
  CanUpdateRule,
  CanCompleteRule,
  CanResetRule,
  CanBlockRule,
  CanUnblockRule,
  CanPauseRule,
  CanResumeRule,
} from "../../../../src/domain/goals/rules/StateTransitionRules";
import { GoalState } from "../../../../src/domain/goals/Goal";
import { GoalStatus } from "../../../../src/domain/goals/Constants";

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

describe("StateTransitionRules", () => {
  describe("CanAddRule", () => {
    it("should pass when version is 0", () => {
      const rule = new CanAddRule();
      const state = createGoalState({ version: 0 });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when version is greater than 0", () => {
      const rule = new CanAddRule();
      const state = createGoalState({ version: 1 });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Goal has already been defined");
    });
  });

  describe("CanRefineRule", () => {
    it("should pass when status is to-do", () => {
      const rule = new CanRefineRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is already refined", () => {
      const rule = new CanRefineRule();
      const state = createGoalState({ status: GoalStatus.REFINED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Goal is already refined.");
    });

    it("should pass when status is in-refinement (idempotent re-entry)", () => {
      const rule = new CanRefineRule();
      const state = createGoalState({ status: GoalStatus.IN_REFINEMENT });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is doing", () => {
      const rule = new CanRefineRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot refine goal in doing status");
    });

    it("should fail when status is postponed", () => {
      const rule = new CanRefineRule();
      const state = createGoalState({ status: GoalStatus.POSTPONED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Cannot refine goal in postponed status. Goal must be in defined status."
      );
    });

    it("should fail when status is completed", () => {
      const rule = new CanRefineRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot refine goal in done status");
    });
  });

  describe("CanStartRule", () => {
    it("should fail when status is to-do (must be refined first)", () => {
      const rule = new CanStartRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot start goal. Goal must be refined first.");
    });

    it("should fail when status is in-refinement (must be refined first)", () => {
      const rule = new CanStartRule();
      const state = createGoalState({ status: GoalStatus.IN_REFINEMENT });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot start goal. Goal must be refined first.");
    });

    it("should pass when status is refined", () => {
      const rule = new CanStartRule();
      const state = createGoalState({ status: GoalStatus.REFINED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is doing (idempotent)", () => {
      const rule = new CanStartRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is blocked", () => {
      const rule = new CanStartRule();
      const state = createGoalState({ status: GoalStatus.BLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot start a blocked goal. Unblock it first.");
    });

    it("should fail when status is completed", () => {
      const rule = new CanStartRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot start a done goal.");
    });

    it("should pass when status is rejected (rework)", () => {
      const rule = new CanStartRule();
      const state = createGoalState({ status: GoalStatus.REJECTED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is unblocked", () => {
      const rule = new CanStartRule();
      const state = createGoalState({ status: GoalStatus.UNBLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("CanUpdateRule", () => {
    it("should pass when status is to-do", () => {
      const rule = new CanUpdateRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is doing", () => {
      const rule = new CanUpdateRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is blocked", () => {
      const rule = new CanUpdateRule();
      const state = createGoalState({ status: GoalStatus.BLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is completed", () => {
      const rule = new CanUpdateRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot update a done goal");
    });
  });

  describe("CanCompleteRule", () => {
    it("should pass when status is qualified", () => {
      const rule = new CanCompleteRule();
      const state = createGoalState({ status: GoalStatus.QUALIFIED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is doing", () => {
      const rule = new CanCompleteRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot complete goal. Goal must be approved first.");
    });

    it("should fail when status is blocked", () => {
      const rule = new CanCompleteRule();
      const state = createGoalState({ status: GoalStatus.BLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot complete goal. Goal must be approved first.");
    });

    it("should fail when status is to-do", () => {
      const rule = new CanCompleteRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot complete goal. Goal must be approved first.");
    });

    it("should fail when status is in-review", () => {
      const rule = new CanCompleteRule();
      const state = createGoalState({ status: GoalStatus.INREVIEW });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot complete goal. Goal must be approved first.");
    });

    it("should fail when status is paused", () => {
      const rule = new CanCompleteRule();
      const state = createGoalState({ status: GoalStatus.PAUSED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot complete goal. Goal must be approved first.");
    });

    it("should fail when status is already completed", () => {
      const rule = new CanCompleteRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Goal is already done");
    });
  });

  describe("CanResetRule", () => {
    // In-progress states: allowed
    it("should pass when status is in-refinement", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.IN_REFINEMENT });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is doing", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is in-review", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.INREVIEW });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is codifying", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.CODIFYING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    // Terminal states: allowed
    it("should pass when status is done", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.DONE });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is completed (legacy)", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    // Blocked: special rejection
    it("should fail when status is blocked", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.BLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Cannot reset a blocked goal. Unblock it first to preserve blocker context.");
    });

    // Waiting states: rejected
    it("should fail when status is defined (waiting state)", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot reset goal. Goal is already in waiting state");
    });

    it("should fail when status is refined (waiting state)", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.REFINED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot reset goal. Goal is already in waiting state");
    });

    it("should fail when status is rejected (waiting state)", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.REJECTED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot reset goal. Goal is already in waiting state");
    });

    it("should fail when status is unblocked (waiting state)", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.UNBLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot reset goal. Goal is already in waiting state");
    });

    it("should fail when status is submitted (waiting state)", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.SUBMITTED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot reset goal. Goal is already in waiting state");
    });

    it("should fail when status is approved (waiting state)", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.QUALIFIED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot reset goal. Goal is already in waiting state");
    });

    it("should fail when status is paused (waiting state)", () => {
      const rule = new CanResetRule();
      const state = createGoalState({ status: GoalStatus.PAUSED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot reset goal. Goal is already in waiting state");
    });
  });

  describe("CanBlockRule", () => {
    it("should pass when status is to-do", () => {
      const rule = new CanBlockRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should pass when status is doing", () => {
      const rule = new CanBlockRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is blocked", () => {
      const rule = new CanBlockRule();
      const state = createGoalState({ status: GoalStatus.BLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot block goal in blocked status");
    });

    it("should pass when status is in-review", () => {
      const rule = new CanBlockRule();
      const state = createGoalState({ status: GoalStatus.INREVIEW });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is completed", () => {
      const rule = new CanBlockRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot block goal in done status");
    });

    it("should fail when status is unblocked", () => {
      const rule = new CanBlockRule();
      const state = createGoalState({ status: GoalStatus.UNBLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot block goal in unblocked status");
    });
  });

  describe("CanUnblockRule", () => {
    it("should pass when status is blocked", () => {
      const rule = new CanUnblockRule();
      const state = createGoalState({ status: GoalStatus.BLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is to-do", () => {
      const rule = new CanUnblockRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot unblock goal in defined status");
    });

    it("should fail when status is doing", () => {
      const rule = new CanUnblockRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot unblock goal in doing status");
    });

    it("should fail when status is completed", () => {
      const rule = new CanUnblockRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot unblock goal in done status");
    });

    it("should fail when status is unblocked", () => {
      const rule = new CanUnblockRule();
      const state = createGoalState({ status: GoalStatus.UNBLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot unblock goal in unblocked status");
    });
  });

  describe("CanPauseRule", () => {
    it("should pass when status is doing", () => {
      const rule = new CanPauseRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is to-do", () => {
      const rule = new CanPauseRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot pause goal in defined status");
    });

    it("should fail when status is blocked", () => {
      const rule = new CanPauseRule();
      const state = createGoalState({ status: GoalStatus.BLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot pause goal in blocked status");
    });

    it("should fail when status is paused", () => {
      const rule = new CanPauseRule();
      const state = createGoalState({ status: GoalStatus.PAUSED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot pause goal in paused status");
    });

    it("should fail when status is completed", () => {
      const rule = new CanPauseRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot pause goal in done status");
    });
  });

  describe("CanResumeRule", () => {
    it("should pass when status is paused", () => {
      const rule = new CanResumeRule();
      const state = createGoalState({ status: GoalStatus.PAUSED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should fail when status is to-do", () => {
      const rule = new CanResumeRule();
      const state = createGoalState({ status: GoalStatus.TODO });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot resume goal in defined status");
    });

    it("should fail when status is doing", () => {
      const rule = new CanResumeRule();
      const state = createGoalState({ status: GoalStatus.DOING });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot resume goal in doing status");
    });

    it("should fail when status is blocked", () => {
      const rule = new CanResumeRule();
      const state = createGoalState({ status: GoalStatus.BLOCKED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot resume goal in blocked status");
    });

    it("should fail when status is completed", () => {
      const rule = new CanResumeRule();
      const state = createGoalState({ status: GoalStatus.COMPLETED });
      const result = rule.validate(state);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Cannot resume goal in done status");
    });
  });
});
