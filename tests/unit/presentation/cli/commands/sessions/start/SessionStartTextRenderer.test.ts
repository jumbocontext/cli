/**
 * Tests for SessionStartTextRenderer session context output
 *
 * Verifies YAML output structure for session context including:
 * - Paused goals and resume prompts
 * - Recent decisions
 * - Brownfield project handling
 * - Token-optimized output (only includes sections when data exists)
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionStartTextRenderer } from "../../../../../../../src/presentation/cli/commands/sessions/start/SessionStartTextRenderer.js";
import { EnrichedSessionContext } from "../../../../../../../src/application/context/sessions/get/EnrichedSessionContext.js";
import { SessionContext } from "../../../../../../../src/application/context/sessions/get/SessionContext.js";
import { GoalView } from "../../../../../../../src/application/context/goals/GoalView.js";
import { DecisionView } from "../../../../../../../src/application/context/decisions/DecisionView.js";
import { SessionView } from "../../../../../../../src/application/context/sessions/SessionView.js";
import { SessionInstructionSignal } from "../../../../../../../src/application/context/sessions/SessionInstructionSignal.js";

describe("SessionStartTextRenderer", () => {
  let renderer: SessionStartTextRenderer;

  beforeEach(() => {
    renderer = new SessionStartTextRenderer();
  });

  const defaultSession: SessionView = {
    sessionId: "session-1",
    status: "active",
    focus: "Test session",
    contextSnapshot: null,
    version: 1,
    startedAt: "2025-01-01T10:00:00Z",
    endedAt: null,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
  };

  function createContext(
    contextOverrides: Partial<SessionContext> = {},
    session: SessionView | null = defaultSession,
    instructions: string[] = []
  ): EnrichedSessionContext {
    return {
      session,
      context: {
        projectContext: null,
        activeGoals: [],
        pausedGoals: [],
        plannedGoals: [],
        recentDecisions: [],
        ...contextOverrides,
      },
      instructions,
      scope: "session-start",
    };
  }

  describe("paused goals rendering", () => {
    it("should include pausedGoals section when goals are paused", () => {
      const context = createContext({
        pausedGoals: [
          {
            goalId: "goal_789",
            objective: "Research API options",
            status: "paused",
            note: "Need more information",
            updatedAt: "2025-01-01T11:15:00Z",
          } as GoalView,
        ],
      });

      const result = renderer.renderSessionSummary(context);

      expect(result).toContain("pausedGoals:");
      expect(result).toContain("goalId: goal_789");
      expect(result).toContain("objective: Research API options");
      expect(result).toContain("note: Need more information");
    });

    it("should handle paused goals without optional note", () => {
      const context = createContext({
        pausedGoals: [
          {
            goalId: "goal_abc",
            objective: "Test task",
            status: "paused",
            updatedAt: "2025-01-01T11:15:00Z",
          } as GoalView,
        ],
      });

      const result = renderer.renderSessionSummary(context);

      expect(result).toContain("pausedGoals:");
      expect(result).toContain("goalId: goal_abc");
      expect(result).not.toContain("note:");
    });

    it("should omit pausedGoals section when no goals are paused", () => {
      const context = createContext({ pausedGoals: [] });

      const result = renderer.renderSessionSummary(context);

      expect(result).not.toContain("pausedGoals:");
    });
  });

  describe("resume prompt for paused goals", () => {
    it("should include @LLM resume prompt when goals are paused", () => {
      const context = createContext({
        pausedGoals: [
          {
            goalId: "goal_pause_test",
            objective: "Paused task",
            status: "paused",
            updatedAt: "2025-01-01T11:15:00Z",
          } as GoalView,
        ],
      });

      const result = renderer.renderSessionSummary(context);

      expect(result).toContain("@LLM:");
      expect(result).toContain("Goals were paused");
      expect(result).toContain("jumbo goal resume --id");
    });

    it("should not include @LLM resume prompt when no goals are paused", () => {
      const context = createContext({ pausedGoals: [] });

      const result = renderer.renderSessionSummary(context);

      expect(result).not.toContain("Goals were paused");
    });
  });

  describe("recent decisions rendering", () => {
    it("should include recentDecisions section when decisions exist", () => {
      const context = createContext({
        recentDecisions: [
          {
            decisionId: "dec_1",
            title: "Use PostgreSQL",
            rationale: "Better for our use case",
          } as DecisionView,
        ],
      });

      const result = renderer.renderSessionSummary(context);

      expect(result).toContain("recentDecisions:");
      expect(result).toContain("decisionId: dec_1");
      expect(result).toContain("title: Use PostgreSQL");
      expect(result).toContain("rationale: Better for our use case");
    });

    it("should omit recentDecisions section when no decisions exist", () => {
      const context = createContext({ recentDecisions: [] });

      const result = renderer.renderSessionSummary(context);

      expect(result).not.toContain("recentDecisions:");
    });
  });

  describe("session status", () => {
    it("should include session status in output", () => {
      const context = createContext();

      const result = renderer.renderSessionSummary(context);

      expect(result).toContain("status: active");
    });
  });

  describe("brownfield project handling", () => {
    it("should return brownfield instructions when brownfield-onboarding instruction is present", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.BROWNFIELD_ONBOARDING]);

      const result = renderer.renderSessionSummary(context);

      expect(result).toContain("BROWNFIELD PROJECT");
      expect(result).toContain("@LLM:");
      expect(result).toContain("jumbo --help");
    });
  });

  describe("null session handling", () => {
    it("should return appropriate message when no active session exists", () => {
      const context = createContext({}, null);

      const result = renderer.renderSessionSummary(context);

      expect(result).toContain("No previous session context available");
      expect(result).not.toContain("BROWNFIELD");
    });
  });

  describe("render method", () => {
    it("should produce blocks for all context sections", () => {
      const context = createContext({
        activeGoals: [{ goalId: "g1", objective: "Active task", status: "doing" } as GoalView],
        plannedGoals: [{ goalId: "g2", objective: "Planned task", status: "defined" } as GoalView],
      });

      const result = renderer.render(context);

      expect(result.blocks.length).toBeGreaterThan(0);
      expect(result.llmInstruction).toContain("@LLM:");
    });
  });
});
