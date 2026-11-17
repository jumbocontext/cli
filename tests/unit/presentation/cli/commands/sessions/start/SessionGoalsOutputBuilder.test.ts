/**
 * Tests for SessionGoalsOutputBuilder
 *
 * Verifies output for session start goal sections including:
 * - Per-state grouping with hints
 * - Status ordering matching GoalListOutputBuilder's STATUS_ORDER
 * - Empty group omission
 * - @LLM goal start instruction
 * - Structured output shape
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionGoalsOutputBuilder } from "../../../../../../../src/presentation/cli/commands/sessions/start/SessionGoalsOutputBuilder.js";
import { GoalView } from "../../../../../../../src/application/context/goals/GoalView.js";

describe("SessionGoalsOutputBuilder", () => {
  let builder: SessionGoalsOutputBuilder;

  beforeEach(() => {
    builder = new SessionGoalsOutputBuilder();
  });

  function makeGoal(overrides: Partial<GoalView>): GoalView {
    return {
      goalId: "g-default",
      objective: "Default objective",
      status: "defined",
      createdAt: "2025-01-01T10:00:00Z",
      ...overrides,
    } as GoalView;
  }

  describe("buildGoalsOutput", () => {
    it("should group goals by status", () => {
      const goals = [
        makeGoal({ goalId: "g1", status: "doing" }),
        makeGoal({ goalId: "g2", status: "refined" }),
        makeGoal({ goalId: "g3", status: "doing" }),
      ];

      const output = builder.buildGoalsOutput(goals);
      const text = output.toHumanReadable();

      expect(text).toContain("doing:");
      expect(text).toContain("refined:");
      expect(text).toContain("goalId: g1");
      expect(text).toContain("goalId: g3");
      expect(text).toContain("goalId: g2");
    });

    it("should include hint per status group", () => {
      const goals = [
        makeGoal({ goalId: "g1", status: "defined" }),
        makeGoal({ goalId: "g2", status: "paused" }),
      ];

      const output = builder.buildGoalsOutput(goals);
      const text = output.toHumanReadable();

      expect(text).toContain("hint: jumbo goal refine --id <id>");
      expect(text).toContain("hint: jumbo goal resume --id <id>");
    });

    it("should omit empty groups", () => {
      const goals = [makeGoal({ goalId: "g1", status: "doing" })];

      const output = builder.buildGoalsOutput(goals);
      const text = output.toHumanReadable();

      expect(text).toContain("doing:");
      expect(text).not.toContain("defined:");
      expect(text).not.toContain("refined:");
      expect(text).not.toContain("paused:");
    });

    it("should order groups by STATUS_ORDER (most progressed first)", () => {
      const goals = [
        makeGoal({ goalId: "g-defined", status: "defined" }),
        makeGoal({ goalId: "g-approved", status: "approved" }),
        makeGoal({ goalId: "g-doing", status: "doing" }),
      ];

      const output = builder.buildGoalsOutput(goals);
      const text = output.toHumanReadable();

      const approvedIdx = text.indexOf("approved:");
      const doingIdx = text.indexOf("doing:");
      const definedIdx = text.indexOf("defined:");

      expect(approvedIdx).toBeLessThan(doingIdx);
      expect(doingIdx).toBeLessThan(definedIdx);
    });

    it("should render goals with no goals as empty goals object", () => {
      const output = builder.buildGoalsOutput([]);
      const text = output.toHumanReadable();

      expect(text).toContain("goals:");
      expect(text).toContain("@LLM:");
    });

    it("should include separator and goal start instruction", () => {
      const output = builder.buildGoalsOutput([]);
      const text = output.toHumanReadable();

      expect(text).toContain("---");
      expect(text).toContain("@LLM:");
    });

    it("should include count per group", () => {
      const goals = [
        makeGoal({ goalId: "g1", status: "doing" }),
        makeGoal({ goalId: "g2", status: "doing" }),
      ];

      const output = builder.buildGoalsOutput(goals);
      const text = output.toHumanReadable();

      expect(text).toContain("count: 2");
    });
  });

  describe("renderGoalStartInstruction", () => {
    it("should instruct LLM to prompt user for goal selection", () => {
      const instruction = builder.renderGoalStartInstruction();

      expect(instruction).toContain("@LLM: Prompt the user for input about what goal to work on.");
    });

    it("should reference per-state hints", () => {
      const instruction = builder.renderGoalStartInstruction();

      expect(instruction).toContain("hint with the suggested next-step command");
    });

    it("should instruct LLM to run suggested command before doing work", () => {
      const instruction = builder.renderGoalStartInstruction();

      expect(instruction).toContain("IMPORTANT: Run the suggested command for the chosen goal before doing any work!");
    });
  });

  describe("buildStructuredGoals", () => {
    it("should return per-state grouped goals with hints", () => {
      const goals = [
        makeGoal({ goalId: "g1", objective: "Active", status: "doing", createdAt: "2025-01-01T10:00:00Z" }),
        makeGoal({ goalId: "g2", objective: "Planned", status: "defined", createdAt: "2025-01-01T10:00:00Z" }),
      ];

      const result = builder.buildStructuredGoals(goals);

      expect(result.goals).toHaveProperty("doing");
      expect(result.goals).toHaveProperty("defined");
      expect(result.goals.doing).toEqual({
        hint: "jumbo goal submit --id <id>",
        count: 1,
        goals: [{ goalId: "g1", objective: "Active", createdAt: "2025-01-01T10:00:00Z" }],
      });
      expect(result.goals.defined).toEqual({
        hint: "jumbo goal refine --id <id>",
        count: 1,
        goals: [{ goalId: "g2", objective: "Planned", createdAt: "2025-01-01T10:00:00Z" }],
      });
      expect(result.llmGoalStartInstruction).toContain("@LLM:");
    });

    it("should return empty goals object when no goals exist", () => {
      const result = builder.buildStructuredGoals([]);

      expect(result.goals).toEqual({});
    });

    it("should include correct hints for all statuses", () => {
      const statuses = ["defined", "refined", "doing", "paused", "blocked", "unblocked", "in-review", "approved", "rejected", "submitted", "in-refinement", "codifying"] as const;
      const expectedHints: Record<string, string> = {
        "defined": "jumbo goal refine --id <id>",
        "refined": "jumbo goal start --id <id>",
        "doing": "jumbo goal submit --id <id>",
        "paused": "jumbo goal resume --id <id>",
        "blocked": "jumbo goal unblock --id <id>",
        "unblocked": "jumbo goal start --id <id>",
        "in-review": "Awaiting QA review",
        "approved": "jumbo goal codify --id <id>",
        "rejected": "jumbo goal start --id <id>",
        "submitted": "jumbo goal review --id <id>",
        "in-refinement": "Awaiting refinement completion",
        "codifying": "Awaiting codification completion",
      };

      const goals = statuses.map((status, i) =>
        makeGoal({ goalId: `g${i}`, status })
      );

      const result = builder.buildStructuredGoals(goals);

      for (const status of statuses) {
        expect(result.goals[status]?.hint).toBe(expectedHints[status]);
      }
    });
  });
});
