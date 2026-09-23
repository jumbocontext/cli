import { describe, it, expect, beforeEach } from "@jest/globals";
import { GoalListOutputBuilder, STATUS_ORDER } from "../../../../../../src/presentation/cli/commands/goals/list/GoalListOutputBuilder.js";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView.js";

function makeGoal(overrides: Partial<GoalView> = {}): GoalView {
  return {
    goalId: "goal_1",
    title: "",
    objective: "Test objective",
    successCriteria: [],
    scopeIn: [],
    scopeOut: [],
    status: "doing",
    version: 1,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
    progress: [],
    ...overrides,
  };
}

describe("GoalListOutputBuilder", () => {
  let builder: GoalListOutputBuilder;

  beforeEach(() => {
    builder = new GoalListOutputBuilder();
  });

  describe("STATUS_ORDER", () => {
    it("should include all non-terminal GoalStatus values", () => {
      const expectedStatuses = [
        "approved", "in-review", "submitted", "paused", "doing",
        "blocked", "unblocked", "rejected", "in-refinement", "codifying",
        "refined", "defined", "postponed"
      ];
      for (const status of expectedStatuses) {
        expect(STATUS_ORDER).toHaveProperty(status);
      }
      expect(Object.keys(STATUS_ORDER)).toHaveLength(expectedStatuses.length);
    });

    it("should order approved before in-review before doing before defined", () => {
      expect(STATUS_ORDER["approved"]).toBeLessThan(STATUS_ORDER["in-review"]);
      expect(STATUS_ORDER["in-review"]).toBeLessThan(STATUS_ORDER["doing"]);
      expect(STATUS_ORDER["doing"]).toBeLessThan(STATUS_ORDER["defined"]);
    });
  });

  describe("buildActiveGoalsList", () => {
    it("should render count header", () => {
      const goals = [makeGoal({ goalId: "g1" }), makeGoal({ goalId: "g2" })];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).toContain("Active Goals (2)");
    });

    it("should group goals under status headings", () => {
      const goals = [
        makeGoal({ goalId: "g1", status: "doing" }),
        makeGoal({ goalId: "g2", status: "defined" }),
      ];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).toContain("[DOING]");
      expect(output).toContain("[DEFINED]");
    });

    it("should order groups by STATUS_ORDER (most progressed first)", () => {
      const goals = [
        makeGoal({ goalId: "g_defined", status: "defined" }),
        makeGoal({ goalId: "g_approved", status: "approved" }),
        makeGoal({ goalId: "g_doing", status: "doing" }),
      ];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      const approvedPos = output.indexOf("[APPROVED]");
      const doingPos = output.indexOf("[DOING]");
      const definedPos = output.indexOf("[DEFINED]");
      expect(approvedPos).toBeLessThan(doingPos);
      expect(doingPos).toBeLessThan(definedPos);
    });

    it("should omit empty groups", () => {
      const goals = [makeGoal({ goalId: "g1", status: "doing" })];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).toContain("[DOING]");
      expect(output).not.toContain("[DEFINED]");
      expect(output).not.toContain("[APPROVED]");
    });

    it("should sort goals within a group by createdAt ascending", () => {
      const goals = [
        makeGoal({ goalId: "g_later", status: "doing", createdAt: "2025-03-01T00:00:00Z" }),
        makeGoal({ goalId: "g_earlier", status: "doing", createdAt: "2025-01-01T00:00:00Z" }),
      ];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      const earlierPos = output.indexOf("g_earlier");
      const laterPos = output.indexOf("g_later");
      expect(earlierPos).toBeLessThan(laterPos);
    });

    it("should render goalId, title, objective, and note for each goal", () => {
      const goals = [
        makeGoal({
          goalId: "goal_abc",
          title: "My Title",
          objective: "My Objective",
          note: "Important note",
          status: "doing",
        }),
      ];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).toContain("goal_abc");
      expect(output).toContain("My Title");
      expect(output).toContain("My Objective");
      expect(output).toContain("Note:");
      expect(output).toContain("Important note");
    });

    it("should not render title line when title is empty", () => {
      const goals = [
        makeGoal({ goalId: "goal_no_title", title: "", objective: "Obj" }),
      ];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).toContain("goal_no_title");
      expect(output).toContain("Obj");
    });

    it("should not render note line when note is absent", () => {
      const goals = [makeGoal({ goalId: "g1", note: undefined })];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).not.toContain("Note:");
    });

    it("should render rejected status group correctly", () => {
      const goals = [
        makeGoal({ goalId: "g_rejected", status: "rejected", objective: "Rejected goal" }),
      ];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).toContain("[REJECTED]");
      expect(output).toContain("g_rejected");
      expect(output).toContain("Rejected goal");
    });

    it("should render submitted status group correctly", () => {
      const goals = [
        makeGoal({ goalId: "g_submitted", status: "submitted", objective: "Submitted goal" }),
      ];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).toContain("[SUBMITTED]");
      expect(output).toContain("g_submitted");
    });

    it("should render postponed goals under a dedicated heading", () => {
      const output = builder.buildActiveGoalsList([
        makeGoal({ goalId: "g_postponed", status: "postponed", objective: "Later work" }),
      ]).toHumanReadable();

      expect(output).toContain("[POSTPONED]");
      expect(output).toContain("g_postponed");
      expect(output).toContain("Later work");
    });

    it("should drop redundant status prefix from per-goal lines", () => {
      const goals = [makeGoal({ goalId: "g1", status: "doing" })];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      // [DOING] heading and g1 goalId should not be on the same line
      const lines = output.split("\n");
      const doingLine = lines.find(l => l.includes("[DOING]"));
      expect(doingLine).not.toContain("g1");
    });

    it("should preserve count header with correct total across groups", () => {
      const goals = [
        makeGoal({ goalId: "g1", status: "doing" }),
        makeGoal({ goalId: "g2", status: "defined" }),
        makeGoal({ goalId: "g3", status: "approved" }),
      ];
      const output = builder.buildActiveGoalsList(goals).toHumanReadable();
      expect(output).toContain("Active Goals (3)");
    });
  });

  describe("buildStructuredOutput", () => {
    it("should not be affected by grouping changes — returns JSON data", () => {
      const goals = [
        makeGoal({ goalId: "g1", status: "defined" }),
        makeGoal({ goalId: "g2", status: "approved" }),
      ];
      const output = builder.buildStructuredOutput(goals);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      expect(dataSection).toBeDefined();
      const data = dataSection!.content as { goals: Array<{ goalId: string; status: string }>; count: number };
      expect(data.count).toBe(2);
      // Approved should sort before defined
      expect(data.goals[0].goalId).toBe("g2");
      expect(data.goals[1].goalId).toBe("g1");
    });
  });
});
