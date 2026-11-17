/**
 * Tests for PrerequisitePolicy (domain rule)
 * Verifies prerequisite satisfaction rules for goal start.
 */

import { describe, it, expect } from "@jest/globals";
import { PrerequisitePolicy, PrerequisiteStatus } from "../../../../../src/domain/goals/rules/PrerequisitePolicy";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";

describe("PrerequisitePolicy", () => {
  const policy = new PrerequisitePolicy();

  function prereq(goalId: string, status: string, objective: string = "Prereq"): PrerequisiteStatus {
    return { goalId, objective, status: status as PrerequisiteStatus["status"] };
  }

  describe("empty prerequisites", () => {
    it("passes when prerequisites array is empty", () => {
      const result = policy.check([]);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfied).toEqual([]);
    });
  });

  describe("satisfied prerequisite statuses (SUBMITTED+)", () => {
    it.each([
      [GoalStatus.SUBMITTED, "submitted"],
      [GoalStatus.INREVIEW, "in-review"],
      [GoalStatus.QUALIFIED, "approved"],
      [GoalStatus.CODIFYING, "codifying"],
      [GoalStatus.DONE, "done"],
    ])("passes when prerequisite is at %s status", (status) => {
      const result = policy.check([prereq("prereq_1", status)]);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfied).toEqual([]);
    });
  });

  describe("unsatisfied prerequisite statuses (before SUBMITTED)", () => {
    it.each([
      [GoalStatus.TODO, "defined"],
      [GoalStatus.REFINED, "refined"],
      [GoalStatus.DOING, "doing"],
      [GoalStatus.BLOCKED, "blocked"],
      [GoalStatus.PAUSED, "paused"],
      [GoalStatus.REJECTED, "rejected"],
      [GoalStatus.UNBLOCKED, "unblocked"],
      [GoalStatus.IN_REFINEMENT, "in-refinement"],
    ])("rejects when prerequisite is at %s status", (status) => {
      const result = policy.check([prereq("prereq_1", status, "Prereq objective")]);

      expect(result.satisfied).toBe(false);
      expect(result.unsatisfied).toHaveLength(1);
      expect(result.unsatisfied[0]).toEqual({
        goalId: "prereq_1",
        objective: "Prereq objective",
        status,
      });
    });
  });

  describe("multiple prerequisites", () => {
    it("passes when all prerequisites are satisfied", () => {
      const result = policy.check([
        prereq("prereq_1", GoalStatus.SUBMITTED, "First"),
        prereq("prereq_2", GoalStatus.DONE, "Second"),
      ]);

      expect(result.satisfied).toBe(true);
      expect(result.unsatisfied).toEqual([]);
    });

    it("lists all unsatisfied prerequisites", () => {
      const result = policy.check([
        prereq("prereq_1", GoalStatus.TODO, "First"),
        prereq("prereq_2", GoalStatus.DONE, "Second"),
        prereq("prereq_3", GoalStatus.REFINED, "Third"),
      ]);

      expect(result.satisfied).toBe(false);
      expect(result.unsatisfied).toHaveLength(2);
      expect(result.unsatisfied[0].goalId).toBe("prereq_1");
      expect(result.unsatisfied[1].goalId).toBe("prereq_3");
    });
  });
});
