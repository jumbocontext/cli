/**
 * Tests for SessionContextOutputBuilder
 *
 * Verifies output for session context orientation including:
 * - Project context rendering (core project fields)
 * - Session summary (focus, status, paused goals, recent decisions)
 * - Brownfield onboarding @LLM prompt
 * - Paused goals resume @LLM prompt
 * - Structured output for JSON mode
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionContextOutputBuilder } from "../../../../../../../src/presentation/cli/commands/sessions/start/SessionContextOutputBuilder.js";
import { EnrichedSessionContext } from "../../../../../../../src/application/context/sessions/get/EnrichedSessionContext.js";
import { SessionContext } from "../../../../../../../src/application/context/sessions/get/SessionContext.js";
import { GoalView } from "../../../../../../../src/application/context/goals/GoalView.js";
import { DecisionView } from "../../../../../../../src/application/context/decisions/DecisionView.js";
import { SessionView } from "../../../../../../../src/application/context/sessions/SessionView.js";
import { SessionInstructionSignal } from "../../../../../../../src/application/context/sessions/SessionInstructionSignal.js";
import { ProjectView } from "../../../../../../../src/application/context/project/ProjectView.js";

describe("SessionContextOutputBuilder", () => {
  let builder: SessionContextOutputBuilder;

  beforeEach(() => {
    builder = new SessionContextOutputBuilder();
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

  describe("buildSessionContext", () => {
    it("should include session status in output", () => {
      const context = createContext();
      const output = builder.buildSessionContext(context);
      const text = output.toHumanReadable();

      expect(text).toContain("status: active");
    });

    it("should include project context when available", () => {
      const context = createContext({
        projectContext: {
          name: "TestProject",
          purpose: "Testing purposes",
        } as unknown as ProjectView,
      });

      const output = builder.buildSessionContext(context);
      const text = output.toHumanReadable();

      expect(text).toContain("name: TestProject");
      expect(text).toContain("purpose: Testing purposes");
    });

    it("should omit project context section when null", () => {
      const context = createContext({ projectContext: null });
      const output = builder.buildSessionContext(context);
      const text = output.toHumanReadable();

      expect(text).not.toContain("projectContext:");
    });
  });

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

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("pausedGoals:");
      expect(text).toContain("goalId: goal_789");
      expect(text).toContain("objective: Research API options");
      expect(text).toContain("note: Need more information");
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

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("pausedGoals:");
      expect(text).toContain("goalId: goal_abc");
      expect(text).not.toContain("note:");
    });

    it("should omit pausedGoals section when no goals are paused", () => {
      const context = createContext({ pausedGoals: [] });
      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("pausedGoals:");
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

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("@LLM:");
      expect(text).toContain("Goals were paused");
      expect(text).toContain("jumbo goal resume --id");
    });

    it("should not include resume prompt when no goals are paused", () => {
      const context = createContext({ pausedGoals: [] });
      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("Goals were paused");
    });

    it("should frame paused goals with workspace language", () => {
      const context = createContext({
        pausedGoals: [
          {
            goalId: "goal_ws",
            objective: "Workspace task",
            status: "paused",
            updatedAt: "2025-01-01T11:15:00Z",
          } as GoalView,
        ],
      });

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("your workspace");
    });
  });

  describe("brownfield workspace framing", () => {
    it("should frame Jumbo as the LLM's persistent memory in brownfield onboarding", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.BROWNFIELD_ONBOARDING]);
      const text = builder.renderSessionSummary(context);

      expect(text).toContain("your Jumbo workspace");
      expect(text).toContain("your persistent memory");
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

      const text = builder.renderSessionSummary(context);

      expect(text).toContain("recentDecisions:");
      expect(text).toContain("decisionId: dec_1");
      expect(text).toContain("title: Use PostgreSQL");
      expect(text).toContain("rationale: Better for our use case");
    });

    it("should omit recentDecisions section when no decisions exist", () => {
      const context = createContext({ recentDecisions: [] });
      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("recentDecisions:");
    });
  });

  describe("brownfield project handling", () => {
    it("should return brownfield instructions when brownfield-onboarding instruction is present", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.BROWNFIELD_ONBOARDING]);
      const text = builder.renderSessionSummary(context);

      expect(text).toContain("BROWNFIELD PROJECT");
      expect(text).toContain("@LLM:");
      expect(text).toContain("jumbo --help");
    });

    it("should not include architecture define in brownfield available commands", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.BROWNFIELD_ONBOARDING]);
      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("jumbo architecture define");
    });
  });

  describe("architecture deprecation notice", () => {
    it("should include deprecation notice when architecture-deprecated signal is present", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.ARCHITECTURE_DEPRECATED]);
      const text = builder.renderSessionSummary(context);

      expect(text).toContain("@LLM:");
      expect(text).toContain("deprecated");
      expect(text).toContain("removed in v3");
      expect(text).toContain("jumbo decision add");
      expect(text).toContain("jumbo invariant add");
      expect(text).toContain("jumbo component add");
      expect(text).toContain("jumbo dependency add");
    });

    it("should not include deprecation notice when architecture-deprecated signal is absent", () => {
      const context = createContext({}, defaultSession, []);
      const text = builder.renderSessionSummary(context);

      expect(text).not.toContain("removed in v3");
    });

    it("should include instruction not to use architecture define or update", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.ARCHITECTURE_DEPRECATED]);
      const text = builder.renderSessionSummary(context);

      expect(text).toContain("Do not use 'jumbo architecture define'");
      expect(text).toContain("jumbo architecture update");
    });
  });

  describe("null session handling", () => {
    it("should return appropriate message when no active session exists", () => {
      const context = createContext({}, null);
      const text = builder.renderSessionSummary(context);

      expect(text).toContain("No previous session context available");
      expect(text).not.toContain("BROWNFIELD");
    });
  });

  describe("buildStructuredSessionContext", () => {
    it("should return structured data with session context", () => {
      const context = createContext({
        recentDecisions: [
          { decisionId: "dec_1", title: "Use PostgreSQL", rationale: "Better" } as DecisionView,
        ],
      });

      const result = builder.buildStructuredSessionContext(context);

      expect(result.projectContext).toBeNull();
      expect(result.sessionContext).toBeDefined();
      expect(result.llmSessionContextInstruction).toBeNull();
    });

    it("should include llm instruction when goals are paused", () => {
      const context = createContext({
        pausedGoals: [
          { goalId: "g1", objective: "Paused", status: "paused", updatedAt: "2025-01-01T11:00:00Z" } as GoalView,
        ],
      });

      const result = builder.buildStructuredSessionContext(context);

      expect(result.llmSessionContextInstruction).toContain("Goals were paused");
    });

    it("should include brownfield instruction when brownfield-onboarding present", () => {
      const context = createContext({}, defaultSession, [SessionInstructionSignal.BROWNFIELD_ONBOARDING]);

      const result = builder.buildStructuredSessionContext(context);

      expect(result.llmSessionContextInstruction).toContain("BROWNFIELD PROJECT");
    });
  });
});
