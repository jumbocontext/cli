/**
 * Tests for GoalRecordMapper
 *
 * Verifies the infrastructure-to-application boundary mapping:
 * JSON.parse for array fields, null-to-undefined coercion for optional fields.
 */

import { GoalRecordMapper } from "../../../../../src/infrastructure/context/goals/GoalRecordMapper";
import { GoalRecord } from "../../../../../src/infrastructure/context/goals/GoalRecord";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";

describe("GoalRecordMapper", () => {
  let mapper: GoalRecordMapper;

  beforeEach(() => {
    mapper = new GoalRecordMapper();
  });

  function buildRecord(overrides: Partial<GoalRecord> = {}): GoalRecord {
    return {
      id: "goal_test-1",
      title: "Test title",
      objective: "Test objective",
      successCriteria: '["criterion 1","criterion 2"]',
      scopeIn: '["in scope"]',
      scopeOut: '["out of scope"]',
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
      note: null,
      reviewIssues: null,
      progress: "[]",
      claimedBy: null,
      claimedAt: null,
      claimExpiresAt: null,
      nextGoalId: null,
      prerequisiteGoals: null,
      ...overrides,
    };
  }

  describe("toView", () => {
    it("maps scalar fields directly", () => {
      const record = buildRecord();

      const view = mapper.toView(record);

      expect(view.goalId).toBe("goal_test-1");
      expect(view.title).toBe("Test title");
      expect(view.objective).toBe("Test objective");
      expect(view.status).toBe(GoalStatus.TODO);
      expect(view.version).toBe(1);
      expect(view.createdAt).toBe("2026-02-01T10:00:00.000Z");
      expect(view.updatedAt).toBe("2026-02-01T10:00:00.000Z");
    });

    it("parses successCriteria JSON string to array", () => {
      const record = buildRecord({
        successCriteria: '["a","b","c"]',
      });

      const view = mapper.toView(record);

      expect(view.successCriteria).toEqual(["a", "b", "c"]);
    });

    it("parses scopeIn JSON string to array", () => {
      const record = buildRecord({ scopeIn: '["x","y"]' });

      const view = mapper.toView(record);

      expect(view.scopeIn).toEqual(["x", "y"]);
    });

    it("parses scopeOut JSON string to array", () => {
      const record = buildRecord({ scopeOut: '["z"]' });

      const view = mapper.toView(record);

      expect(view.scopeOut).toEqual(["z"]);
    });

    it("parses progress JSON string to array", () => {
      const record = buildRecord({
        progress: '["task 1 done","task 2 done"]',
      });

      const view = mapper.toView(record);

      expect(view.progress).toEqual(["task 1 done", "task 2 done"]);
    });

    it("defaults empty JSON array fields to empty arrays", () => {
      const record = buildRecord({
        successCriteria: "",
        scopeIn: "",
        scopeOut: "",
        progress: "",
      });

      const view = mapper.toView(record);

      expect(view.successCriteria).toEqual([]);
      expect(view.scopeIn).toEqual([]);
      expect(view.scopeOut).toEqual([]);
      expect(view.progress).toEqual([]);
    });

    it("coerces null note to undefined", () => {
      const record = buildRecord({ note: null });

      const view = mapper.toView(record);

      expect(view.note).toBeUndefined();
    });

    it("preserves non-null note value", () => {
      const record = buildRecord({ note: "Blocked on dependency" });

      const view = mapper.toView(record);

      expect(view.note).toBe("Blocked on dependency");
    });

    it("coerces null reviewIssues to undefined", () => {
      const record = buildRecord({ reviewIssues: null });

      const view = mapper.toView(record);

      expect(view.reviewIssues).toBeUndefined();
    });

    it("preserves non-null reviewIssues value", () => {
      const record = buildRecord({ reviewIssues: "Tests are failing in auth module" });

      const view = mapper.toView(record);

      expect(view.reviewIssues).toBe("Tests are failing in auth module");
    });

    it("coerces null claim fields to undefined", () => {
      const record = buildRecord({
        claimedBy: null,
        claimedAt: null,
        claimExpiresAt: null,
      });

      const view = mapper.toView(record);

      expect(view.claimedBy).toBeUndefined();
      expect(view.claimedAt).toBeUndefined();
      expect(view.claimExpiresAt).toBeUndefined();
    });

    it("preserves non-null claim fields", () => {
      const record = buildRecord({
        claimedBy: "worker_abc",
        claimedAt: "2026-02-01T10:00:00.000Z",
        claimExpiresAt: "2026-02-01T10:30:00.000Z",
      });

      const view = mapper.toView(record);

      expect(view.claimedBy).toBe("worker_abc");
      expect(view.claimedAt).toBe("2026-02-01T10:00:00.000Z");
      expect(view.claimExpiresAt).toBe("2026-02-01T10:30:00.000Z");
    });

    it("coerces null nextGoalId to undefined", () => {
      const record = buildRecord({ nextGoalId: null });

      const view = mapper.toView(record);

      expect(view.nextGoalId).toBeUndefined();
    });

    it("preserves non-null nextGoalId", () => {
      const record = buildRecord({ nextGoalId: "goal_next-1" });

      const view = mapper.toView(record);

      expect(view.nextGoalId).toBe("goal_next-1");
    });

    it("coerces null prerequisiteGoals to undefined", () => {
      const record = buildRecord({ prerequisiteGoals: null });

      const view = mapper.toView(record);

      expect(view.prerequisiteGoals).toBeUndefined();
    });

    it("parses prerequisiteGoals JSON string to array", () => {
      const record = buildRecord({
        prerequisiteGoals: '["goal_prereq-1","goal_prereq-2"]',
      });

      const view = mapper.toView(record);

      expect(view.prerequisiteGoals).toEqual(["goal_prereq-1", "goal_prereq-2"]);
    });
  });
});
