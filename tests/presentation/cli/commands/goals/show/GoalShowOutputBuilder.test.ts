/**
 * Tests for GoalShowOutputBuilder
 *
 * Verifies output for goal show command including:
 * - TTY formatted output using Jumbo design system layout
 *   (accent bar headings, metadata block, word wrapping, two dividers, static footer)
 * - Non-TTY structured JSON output
 * - Error output rendering via StyleConfig Templates
 * - All goal detail sections and related context sections
 *
 * Note: Jest runs without a TTY, so Symbols fallback to ASCII variants
 * (e.g. "|" instead of "│", "[x]" instead of "✓"). Tests assert on
 * content presence rather than specific Unicode symbols.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { GoalShowOutputBuilder } from "../../../../../../src/presentation/cli/commands/goals/show/GoalShowOutputBuilder.js";
import { ContextualGoalView } from "../../../../../../src/application/context/goals/get/ContextualGoalView.js";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView.js";
import { GoalContext } from "../../../../../../src/application/context/goals/get/GoalContext.js";
import { ComponentView } from "../../../../../../src/application/context/components/ComponentView.js";
import { DecisionView } from "../../../../../../src/application/context/decisions/DecisionView.js";
import { InvariantView } from "../../../../../../src/application/context/invariants/InvariantView.js";
import { GuidelineView } from "../../../../../../src/application/context/guidelines/GuidelineView.js";
import { stripAnsi, Symbols } from "../../../../../../src/presentation/cli/rendering/StyleConfig.js";

describe("GoalShowOutputBuilder", () => {
  let builder: GoalShowOutputBuilder;
  const BAR = Symbols.accentBar;

  beforeEach(() => {
    builder = new GoalShowOutputBuilder();
  });

  function makeGoal(overrides: Partial<GoalView> = {}): GoalView {
    return {
      goalId: "goal_show_123",
      title: "Test Goal Title",
      objective: "Implement feature X",
      successCriteria: ["Criterion A", "Criterion B"],
      scopeIn: ["src/feature/"],
      scopeOut: ["src/other/"],
      status: "defined",
      version: 1,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T12:00:00Z",
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

  function makeContextualView(
    goalOverrides: Partial<GoalView> = {},
    contextOverrides: Partial<GoalContext> = {}
  ): ContextualGoalView {
    return {
      goal: makeGoal(goalOverrides),
      context: makeContext(contextOverrides),
    };
  }

  describe("build (TTY output)", () => {
    it("should render '| Goal' as heading with title as content on the next line", () => {
      const view = makeContextualView();
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Goal`);
      expect(text).toContain("Test Goal Title");
      // Title should NOT be the heading text itself
      expect(text).not.toContain(`${BAR} Test Goal Title`);
    });

    it("should render goal ID in the metadata block as 'Id:' field", () => {
      const view = makeContextualView();
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain("Id:");
      expect(text).toContain("goal_show_123");
    });

    it("should render metadata fields: Id, Status, Version, Created, Updated", () => {
      const view = makeContextualView();
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain("Id:");
      expect(text).toContain("Status:");
      expect(text).toContain("Version:");
      expect(text).toContain("Created:");
      expect(text).toContain("Updated:");
    });

    it("should render status with semantic symbol and bold status text", () => {
      const view = makeContextualView({ status: "doing" as GoalView["status"] });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain("Status:");
      expect(text).toContain("doing");
    });

    it("should render accent bar on section headings only", () => {
      const view = makeContextualView();
      const text = stripAnsi(builder.build(view).toHumanReadable());
      const lines = text.split("\n").filter(l => l.trim().length > 0);
      const barLines = lines.filter(l => l.includes(BAR));

      // Accent bar appears on heading lines (Goal, Objective, Success Criteria, Scope)
      expect(barLines.length).toBeGreaterThanOrEqual(2);
      // But not on every content line
      expect(barLines.length).toBeLessThan(lines.length);
    });

    it("should render objective in its own section with word wrapping", () => {
      const longObjective = "This is a very long objective that should be word wrapped at the appropriate column width to ensure it fits within the design system layout constraints";
      const view = makeContextualView({ objective: longObjective });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Objective`);
      expect(text).toContain("This is a very long objective");
    });

    it("should render success criteria as bulleted list items", () => {
      const view = makeContextualView();
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Success Criteria`);
      expect(text).toContain("Criterion A");
      expect(text).toContain("Criterion B");
    });

    it("should word-wrap long success criteria with continuation at indent column", () => {
      const longCriterion = "This is a very long success criterion that should wrap at the indent column width and the continuation lines should align flush with the text not the bullet";
      const view = makeContextualView({ successCriteria: [longCriterion] });
      const text = stripAnsi(builder.build(view).toHumanReadable());
      const lines = text.split("\n");

      // The criterion should span multiple lines
      const criterionLines = lines.filter(l => l.includes("criterion") || l.includes("continuation") || l.includes("bullet"));
      expect(criterionLines.length).toBeGreaterThanOrEqual(2);
    });

    it("should render progress entries when present", () => {
      const view = makeContextualView({
        progress: ["Implemented data flow", "Verified command output"],
      });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain("Implemented data flow");
      expect(text).toContain("Verified command output");
    });

    it("should word-wrap long progress entries with continuation at indent column", () => {
      const longProgressEntry = "Completed a long implementation step that should wrap at the indent column width and keep continuation text aligned with the progress item text";
      const view = makeContextualView({ progress: [longProgressEntry] });
      const text = stripAnsi(builder.build(view).toHumanReadable());
      const lines = text.split("\n");

      const progressLines = lines.filter(l => l.includes("implementation step") || l.includes("continuation text") || l.includes("progress item"));
      expect(progressLines.length).toBeGreaterThanOrEqual(2);
    });

    it("should omit progress section when no progress exists", () => {
      const view = makeContextualView({ progress: [] });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).not.toContain("Current Progress");
    });

    it("should render scope with in/out indicators", () => {
      const view = makeContextualView();
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Scope`);
      expect(text).toContain("In:");
      expect(text).toContain("src/feature/");
      expect(text).toContain("Out:");
      expect(text).toContain("src/other/");
    });

    it("should render three dividers when related context exists: metadata, band 2, footer", () => {
      const view = makeContextualView({}, {
        components: [{
          entity: { componentId: "c1", name: "Svc", type: "service", description: "desc" } as unknown as ComponentView,
          relationType: "involves",
          relationDescription: "",
        }],
      });
      const text = stripAnsi(builder.build(view).toHumanReadable());
      const dividerCount = (text.match(/─{10,}/g) || []).length;

      expect(dividerCount).toBe(3);
    });

    it("should render two dividers when no context entities exist: metadata and footer", () => {
      const view = makeContextualView();
      const text = stripAnsi(builder.build(view).toHumanReadable());
      const dividerCount = (text.match(/─{10,}/g) || []).length;

      expect(dividerCount).toBe(2);
    });

    it("should render note when present", () => {
      const view = makeContextualView({ note: "Blocked on upstream dependency" });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Note`);
      expect(text).toContain("Blocked on upstream dependency");
    });

    it("should render review issues when present", () => {
      const view = makeContextualView({ reviewIssues: "Missing test coverage" });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Review Issues`);
      expect(text).toContain("Missing test coverage");
    });

    it("should render prerequisite goals in metadata block", () => {
      const view = makeContextualView({ prerequisiteGoals: ["prereq_1", "prereq_2"] });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain("Prereq:");
      expect(text).toContain("prereq_1");
      expect(text).toContain("prereq_2");
    });

    it("should render next goal in metadata block", () => {
      const view = makeContextualView({ nextGoalId: "next_goal_456" });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain("Next:");
      expect(text).toContain("next_goal_456");
    });

    it("should render workspace when branch or worktree present", () => {
      const view = makeContextualView({ branch: "feature/test", worktree: "/tmp/worktree" });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Workspace`);
      expect(text).toContain("Branch:");
      expect(text).toContain("feature/test");
      expect(text).toContain("Worktree:");
      expect(text).toContain("/tmp/worktree");
    });

    it("should render claim details when claimed", () => {
      const view = makeContextualView({
        claimedBy: "worker_1",
        claimedAt: "2025-01-01T10:00:00Z",
        claimExpiresAt: "2025-01-01T11:00:00Z",
      });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Claim`);
      expect(text).toContain("Claimed By:");
      expect(text).toContain("worker_1");
      expect(text).toContain("Claimed At:");
      expect(text).toContain("Expires At:");
    });

    it("should format all status types with semantic indicators", () => {
      const statuses = ["doing", "refined", "in-review", "rejected", "blocked", "postponed", "done"];

      for (const status of statuses) {
        const view = makeContextualView({ status: status as GoalView["status"] });
        const text = stripAnsi(builder.build(view).toHumanReadable());
        expect(text).toContain(status);
      }
    });

    it("should render related components with name and description", () => {
      const view = makeContextualView({}, {
        components: [{
          entity: { componentId: "comp_1", name: "AuthService", type: "service", description: "Handles authentication" } as unknown as ComponentView,
          relationType: "involves",
          relationDescription: "Modified during implementation",
        }],
      });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Related Components`);
      expect(text).toContain("AuthService");
      expect(text).toContain("Handles authentication");
    });

    it("should render related decisions with title, context, and rationale", () => {
      const view = makeContextualView({}, {
        decisions: [{
          entity: { decisionId: "dec_1", title: "Use REST over gRPC", context: "Clients span many platforms", rationale: "Simpler client integration" } as unknown as DecisionView,
          relationType: "must-respect",
          relationDescription: "Architecture constraint",
        }],
      });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Related Decisions`);
      expect(text).toContain("Use REST over gRPC");
      expect(text).toContain("Context:");
      expect(text).toContain("Clients span many platforms");
      expect(text).toContain("Rationale:");
      expect(text).toContain("Simpler client integration");
    });

    it("should render invariants with title and description", () => {
      const view = makeContextualView({}, {
        invariants: [{
          entity: { invariantId: "inv_1", title: "No magic strings", description: "Use constants" } as unknown as InvariantView,
          relationType: "must-respect",
          relationDescription: "Constraint",
        }],
      });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Invariants`);
      expect(text).toContain("No magic strings");
      expect(text).toContain("Use constants");
    });

    it("should render guidelines with category badge and description", () => {
      const view = makeContextualView({}, {
        guidelines: [{
          entity: { guidelineId: "guide_1", category: "testing", description: "All rules must be tested" } as unknown as GuidelineView,
          relationType: "follows",
          relationDescription: "Practice",
        }],
      });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain(`${BAR} Guidelines`);
      expect(text).toContain("[testing]");
      expect(text).toContain("All rules must be tested");
    });

    it("should render static footer with arrow and goal start command", () => {
      const view = makeContextualView();
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).toContain("To start: jumbo goal start --id goal_show_123");
    });

    it("should omit optional sections when not present", () => {
      const view = makeContextualView({
        note: undefined,
        reviewIssues: undefined,
        nextGoalId: undefined,
        prerequisiteGoals: undefined,
        branch: undefined,
        worktree: undefined,
        claimedBy: undefined,
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
      });
      const text = stripAnsi(builder.build(view).toHumanReadable());

      expect(text).not.toContain(`${BAR} Note`);
      expect(text).not.toContain(`${BAR} Review Issues`);
      expect(text).not.toContain("Next:");
      expect(text).not.toContain("Prereq:");
      expect(text).not.toContain(`${BAR} Workspace`);
      expect(text).not.toContain(`${BAR} Claim`);
      expect(text).not.toContain(`${BAR} Success Criteria`);
      expect(text).not.toContain(`${BAR} Scope`);
    });
  });

  describe("buildStructuredOutput (non-TTY output)", () => {
    it("should produce a single JSON-serializable data section", () => {
      const view = makeContextualView();
      const output = builder.buildStructuredOutput(view);
      const sections = output.getSections();

      const dataSections = sections.filter(s => s.type === "data");
      expect(dataSections).toHaveLength(1);
    });

    it("should include all goal fields in structured output", () => {
      const view = makeContextualView({
        note: "A note",
        nextGoalId: "next_1",
        prerequisiteGoals: ["prereq_1"],
        branch: "feat/x",
        worktree: "/tmp/wt",
        claimedBy: "worker_1",
        claimedAt: "2025-01-01T10:00:00Z",
        claimExpiresAt: "2025-01-01T11:00:00Z",
      });
      const output = builder.buildStructuredOutput(view);
      const sections = output.getSections();
      const data = sections.find(s => s.type === "data")!.content as { goal: GoalView } & GoalContext;

      expect(data.goal.goalId).toBe("goal_show_123");
      expect(data.goal.title).toBe("Test Goal Title");
      expect(data.goal.objective).toBe("Implement feature X");
      expect(data.goal.status).toBe("defined");
      expect(data.goal.note).toBe("A note");
      expect(data.goal.progress).toEqual([]);
      expect(data.goal.nextGoalId).toBe("next_1");
      expect(data.goal.prerequisiteGoals).toEqual(["prereq_1"]);
      expect(data.goal.branch).toBe("feat/x");
      expect(data.goal.claimedBy).toBe("worker_1");
    });

    it("should include progress entries in structured output preserving order", () => {
      const progress = ["Completed first task", "Completed second task"];
      const view = makeContextualView({ progress });
      const output = builder.buildStructuredOutput(view);
      const sections = output.getSections();
      const data = sections.find(s => s.type === "data")!.content as { goal: GoalView } & GoalContext;

      expect(data.goal.progress).toEqual(progress);
    });

    it("should emit an empty progress array in structured output when no progress exists", () => {
      const view = makeContextualView({ progress: [] });
      const output = builder.buildStructuredOutput(view);
      const sections = output.getSections();
      const data = sections.find(s => s.type === "data")!.content as { goal: GoalView } & GoalContext;

      expect(data.goal.progress).toEqual([]);
    });

    it("should include context arrays in structured output", () => {
      const view = makeContextualView({}, {
        components: [{
          entity: { componentId: "comp_1", name: "Svc", type: "service", description: "A service" } as unknown as ComponentView,
          relationType: "involves",
          relationDescription: "Test",
        }],
      });
      const output = builder.buildStructuredOutput(view);
      const sections = output.getSections();
      const data = sections.find(s => s.type === "data")!.content as { goal: GoalView } & GoalContext;

      expect(data.components).toHaveLength(1);
      expect(data.components[0].entity.name).toBe("Svc");
    });
  });

  describe("buildGoalNotFoundError", () => {
    it("should render error message with goal ID", () => {
      const output = builder.buildGoalNotFoundError("goal_missing");
      const text = stripAnsi(output.toHumanReadable());

      expect(text).toContain("Goal not found");
      expect(text).toContain("goal_missing");
    });

    it("should use error symbol from StyleConfig", () => {
      const output = builder.buildGoalNotFoundError("goal_missing");
      const text = output.toHumanReadable();

      expect(text).toMatch(/❌|ERROR/);
    });
  });

  describe("buildFailureError", () => {
    it("should render failure message from Error", () => {
      const output = builder.buildFailureError(new Error("Something broke"));
      const text = stripAnsi(output.toHumanReadable());

      expect(text).toContain("Failed to show goal");
      expect(text).toContain("Something broke");
    });

    it("should render failure message from string", () => {
      const output = builder.buildFailureError("String error");
      const text = stripAnsi(output.toHumanReadable());

      expect(text).toContain("Failed to show goal");
      expect(text).toContain("String error");
    });
  });
});
