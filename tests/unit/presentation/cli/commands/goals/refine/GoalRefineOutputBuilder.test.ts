/**
 * Tests for GoalRefineOutputBuilder
 *
 * Verifies output for goal refine command including:
 * - Success/error output rendering
 * - Goal details and refinement prompt
 * - Prerequisite discovery instructions
 * - Relation registration instructions
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { GoalRefineOutputBuilder } from "../../../../../../../src/presentation/cli/commands/goals/refine/GoalRefineOutputBuilder.js";
import { GoalView } from "../../../../../../../src/application/context/goals/GoalView.js";

describe("GoalRefineOutputBuilder", () => {
  let builder: GoalRefineOutputBuilder;

  beforeEach(() => {
    builder = new GoalRefineOutputBuilder();
  });

  function makeGoal(overrides: Partial<GoalView> = {}): GoalView {
    return {
      goalId: "goal_refine_123",
      title: "Refine Test Goal",
      objective: "Build feature Y",
      successCriteria: ["Criterion 1"],
      scopeIn: ["src/feature/"],
      scopeOut: ["src/other/"],
      status: "in-refinement",
      version: 1,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
      progress: [],
      ...overrides,
    } as GoalView;
  }

  describe("buildSuccess", () => {
    it("should render success message", () => {
      const output = builder.buildSuccess("goal_123", "in-refinement");
      const text = output.toHumanReadable();

      expect(text).toContain("Goal refinement started");
    });

    it("should include commit instruction with goal ID", () => {
      const output = builder.buildSuccess("goal_123", "in-refinement");
      const text = output.toHumanReadable();

      expect(text).toContain("jumbo goal commit --id goal_123");
    });
  });

  describe("buildGoalNotFoundError", () => {
    it("should render error message with goal ID", () => {
      const output = builder.buildGoalNotFoundError("goal_missing");
      const text = output.toHumanReadable();

      expect(text).toContain("Goal not found");
      expect(text).toContain("goal_missing");
    });
  });

  describe("buildFailureError", () => {
    it("should render failure message from Error", () => {
      const output = builder.buildFailureError(new Error("Something broke"));
      const text = output.toHumanReadable();

      expect(text).toContain("Failed to refine goal");
      expect(text).toContain("Something broke");
    });

    it("should render failure message from string", () => {
      const output = builder.buildFailureError("String error");
      const text = output.toHumanReadable();

      expect(text).toContain("Failed to refine goal");
      expect(text).toContain("String error");
    });
  });

  describe("buildGoalDetailsAndRefinementPrompt", () => {
    it("should render goal details", () => {
      const goal = makeGoal();
      const output = builder.buildGoalDetailsAndRefinementPrompt(goal);
      const text = output.toHumanReadable();

      expect(text).toContain("Id:");
      expect(text).toContain("goal_refine_123");
      expect(text).toContain("Status:");
      expect(text).toContain("in-refinement");
      expect(text).toContain("Build feature Y");
    });

    it("should render success criteria", () => {
      const goal = makeGoal();
      const output = builder.buildGoalDetailsAndRefinementPrompt(goal);
      const text = output.toHumanReadable();

      expect(text).toContain("Success Criteria");
      expect(text).toContain("Criterion 1");
    });

    it("should render scope sections", () => {
      const goal = makeGoal();
      const output = builder.buildGoalDetailsAndRefinementPrompt(goal);
      const text = output.toHumanReadable();

      expect(text).toContain("Scope: In");
      expect(text).toContain("src/feature/");
      expect(text).toContain("Scope: Out");
      expect(text).toContain("src/other/");
    });

    it("should include comprehensive relation registration instructions", () => {
      const goal = makeGoal();
      const output = builder.buildGoalDetailsAndRefinementPrompt(goal);
      const text = output.toHumanReadable();

      expect(text).toContain("@LLM: CRITICAL");
      expect(text).toContain("jumbo relation add --from-type goal --from-id goal_refine_123");
      expect(text).toContain("jumbo goal commit --id goal_refine_123");
    });

    it("should include prerequisite discovery instructions", () => {
      const goal = makeGoal();
      const output = builder.buildGoalDetailsAndRefinementPrompt(goal);
      const text = output.toHumanReadable();

      expect(text).toContain("PREREQUISITE DISCOVERY:");
      expect(text).toContain("jumbo goal add --objective");
      expect(text).toContain("jumbo goal update --id goal_refine_123 --prerequisite-goals");
      expect(text).toContain("Continue refinement of this goal");
    });

    it("should instruct immediate prerequisite capture", () => {
      const goal = makeGoal();
      const output = builder.buildGoalDetailsAndRefinementPrompt(goal);
      const text = output.toHumanReadable();

      expect(text).toContain("Do not defer prerequisite registration");
      expect(text).toContain("capture it the moment you identify it");
    });

    it("should include entity exploration commands", () => {
      const goal = makeGoal();
      const output = builder.buildGoalDetailsAndRefinementPrompt(goal);
      const text = output.toHumanReadable();

      expect(text).toContain("jumbo invariants list");
      expect(text).toContain("jumbo guidelines list");
      expect(text).toContain("jumbo decisions list");
      expect(text).toContain("jumbo components search");
    });
  });

  describe("buildInteractiveFlowHeader", () => {
    it("should render relation registration header", () => {
      const output = builder.buildInteractiveFlowHeader();
      const text = output.toHumanReadable();

      expect(text).toContain("Goal Refinement: Register Relations");
    });
  });

  describe("buildCreatedRelations", () => {
    it("should render created relations list", () => {
      const relations = [
        { relationType: "involves", toType: "component", toId: "comp_1" },
        { relationType: "must-respect", toType: "invariant", toId: "inv_1" },
      ];
      const output = builder.buildCreatedRelations(relations);
      const text = output.toHumanReadable();

      expect(text).toContain("Relations Registered");
      expect(text).toContain("involves");
      expect(text).toContain("component:comp_1");
      expect(text).toContain("must-respect");
      expect(text).toContain("invariant:inv_1");
    });
  });
});
