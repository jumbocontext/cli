/**
 * Tests for GoalStartOutputBuilder
 *
 * Verifies output for goal start command including:
 * - Goal implementation instructions rendering
 * - Context maintenance instructions with concrete commands
 * - Scope, components, decisions, invariants, guidelines sections
 * - Progress tracking and submit instructions
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { GoalStartOutputBuilder } from "../../../../../../../src/presentation/cli/commands/goals/start/GoalStartOutputBuilder.js";
import { ContextualGoalView } from "../../../../../../../src/application/context/goals/get/ContextualGoalView.js";
import { GoalView } from "../../../../../../../src/application/context/goals/GoalView.js";
import { GoalContext } from "../../../../../../../src/application/context/goals/get/GoalContext.js";
import { ComponentView } from "../../../../../../../src/application/context/components/ComponentView.js";
import { DecisionView } from "../../../../../../../src/application/context/decisions/DecisionView.js";
import { InvariantView } from "../../../../../../../src/application/context/invariants/InvariantView.js";
import { stripAnsi } from "../../../../../../../src/presentation/cli/rendering/StyleConfig.js";

describe("GoalStartOutputBuilder", () => {
  let builder: GoalStartOutputBuilder;

  beforeEach(() => {
    builder = new GoalStartOutputBuilder();
  });

  function makeGoal(overrides: Partial<GoalView> = {}): GoalView {
    return {
      goalId: "goal_test_123",
      title: "Test Goal",
      objective: "Implement feature X",
      successCriteria: ["Criterion A", "Criterion B"],
      scopeIn: [],
      scopeOut: [],
      status: "doing",
      version: 1,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
      progress: [],
      ...overrides,
    } as GoalView;
  }

  function makeContext(overrides: Partial<GoalContext> = {}): GoalContext {
    return {
      components: [],
      dependencies: [],
      decisions: [],
      invariants: [],
      guidelines: [],
      ...overrides,
    };
  }

  function makeView(
    goalOverrides: Partial<GoalView> = {},
    contextOverrides: Partial<GoalContext> = {}
  ): ContextualGoalView {
    return {
      goal: makeGoal(goalOverrides),
      context: makeContext(contextOverrides),
    };
  }

  describe("build", () => {
    it("should render objective section", () => {
      const view = makeView();
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Objective");
      expect(text).toContain("Implement feature X");
    });

    it("should render success criteria section", () => {
      const view = makeView();
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Success Criteria");
      expect(text).toContain("Criterion A");
      expect(text).toContain("Criterion B");
    });

    it("should render scope sections when scoped", () => {
      const view = makeView({
        scopeIn: ["src/feature/"],
        scopeOut: ["src/other/"],
      });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Scope: In");
      expect(text).toContain("src/feature/");
      expect(text).toContain("Scope: Out");
      expect(text).toContain("src/other/");
    });

    it("should render progress section when progress exists", () => {
      const view = makeView({ progress: ["Completed step 1", "Completed step 2"] });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Current Progress");
      expect(text).toContain("Completed step 1");
      expect(text).toContain("Completed step 2");
    });

    it("should render review issues when restarting a rejected goal", () => {
      const view = makeView({
        status: "doing",
        reviewIssues: "Missing test coverage for rejected goal rework",
      });
      const output = builder.build(view);
      const text = stripAnsi(output.toHumanReadable());

      expect(text).toContain("Review Issues");
      expect(text).toContain("Missing test coverage for rejected goal rework");
      expect(text).toContain("MUST address these issues before submitting the goal again");
    });

    it("should include submit instruction with goal ID", () => {
      const view = makeView({ goalId: "goal_abc" });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("jumbo goal submit --id goal_abc");
    });

    it("should include progress tracking instruction with goal ID", () => {
      const view = makeView({ goalId: "goal_abc" });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("jumbo goal update-progress --id goal_abc");
    });
  });

  describe("workspace section", () => {
    it("should render branch and worktree when both are defined", () => {
      const view = makeView({ branch: "feature/goal-123", worktree: "/worktrees/goal-123" });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Workspace");
      expect(text).toContain("Branch:");
      expect(text).toContain("feature/goal-123");
      expect(text).toContain("Worktree:");
      expect(text).toContain("/worktrees/goal-123");
      expect(text).toContain("MUST isolate your work in the identified branch and worktree");
    });

    it("should render branch only when worktree is not defined", () => {
      const view = makeView({ branch: "feature/goal-123" });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Workspace");
      expect(text).toContain("Branch:");
      expect(text).toContain("feature/goal-123");
      expect(text).not.toContain("Worktree:");
      expect(text).toContain("MUST isolate your work in the identified branch");
    });

    it("should render worktree only when branch is not defined", () => {
      const view = makeView({ worktree: "/worktrees/goal-123" });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Workspace");
      expect(text).toContain("Worktree:");
      expect(text).toContain("/worktrees/goal-123");
      expect(text).not.toContain("Branch:");
      expect(text).toContain("MUST isolate your work in the identified worktree");
    });

    it("should not render workspace section when neither branch nor worktree is defined", () => {
      const view = makeView();
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).not.toContain("Workspace");
    });
  });

  describe("context maintenance instructions", () => {
    it("should include context maintenance section with concrete commands", () => {
      const view = makeView();
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("CONTEXT MAINTENANCE:");
      expect(text).toContain("jumbo decision add --title");
      expect(text).toContain("jumbo component add --name");
      expect(text).toContain("jumbo relation add --from-type goal");
      expect(text).toContain("goal_test_123");
      expect(text).toContain("jumbo invariant add --category");
      expect(text).toContain("jumbo guideline add --category");
    });

    it("should emphasize real-time registration over cleanup", () => {
      const view = makeView();
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("not as a cleanup step at the end");
      expect(text).toContain("Capture it as it happens");
    });

    it("should include goal-specific relation add command with correct goal ID", () => {
      const view = makeView({ goalId: "goal_specific_456" });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("goal_specific_456");
    });
  });

  describe("components section", () => {
    it("should render components when present", () => {
      const view = makeView({}, {
        components: [
          { entity: { name: "AuthService", description: "Handles authentication" } as unknown as ComponentView, relationType: "involves", relationDescription: "" },
        ],
      });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Relevant Components");
      expect(text).toContain("AuthService");
      expect(text).toContain("Handles authentication");
    });
  });

  describe("decisions section", () => {
    it("should render decisions when present", () => {
      const view = makeView({}, {
        decisions: [
          { entity: { title: "Use REST", rationale: "Simpler than GraphQL" } as unknown as DecisionView, relationType: "implements", relationDescription: "" },
        ],
      });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Relevant Decisions");
      expect(text).toContain("Use REST");
      expect(text).toContain("Simpler than GraphQL");
    });
  });

  describe("invariants section", () => {
    it("should render invariants when present", () => {
      const view = makeView({}, {
        invariants: [
          { entity: { title: "No raw SQL", description: "Always use query builder" } as unknown as InvariantView, relationType: "must-respect", relationDescription: "" },
        ],
      });
      const output = builder.build(view);
      const text = output.toHumanReadable();

      expect(text).toContain("Invariants");
      expect(text).toContain("No raw SQL");
      expect(text).toContain("Always use query builder");
    });
  });
});
