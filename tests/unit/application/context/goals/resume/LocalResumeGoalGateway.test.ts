/**
 * Tests for LocalResumeGoalGateway
 * Verifies gateway delegates to command handler correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { LocalResumeGoalGateway } from "../../../../../../src/application/context/goals/resume/LocalResumeGoalGateway";
import { ResumeGoalCommandHandler } from "../../../../../../src/application/context/goals/resume/ResumeGoalCommandHandler";
import { ContextualGoalView } from "../../../../../../src/application/context/goals/get/ContextualGoalView";

describe("LocalResumeGoalGateway", () => {
  let gateway: LocalResumeGoalGateway;
  let mockCommandHandler: jest.Mocked<Pick<ResumeGoalCommandHandler, "execute">>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn<ResumeGoalCommandHandler["execute"]>(),
    };
    gateway = new LocalResumeGoalGateway(
      mockCommandHandler as unknown as ResumeGoalCommandHandler
    );
  });

  it("should execute command and return contextual goal view", async () => {
    const mockContextualView: ContextualGoalView = {
      goal: {
        goalId: "goal_123",
        objective: "Test objective",
        successCriteria: ["Criterion"],
        scopeIn: [],
        scopeOut: [],
        status: "doing",
        version: 4,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T03:00:00Z",
        progress: [],
      },
      context: {
        components: [],
        dependencies: [],
        decisions: [],
        invariants: [],
        guidelines: [],
      },
    };
    mockCommandHandler.execute.mockResolvedValue(mockContextualView);

    const result = await gateway.resumeGoal({
      goalId: "goal_123",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
      note: undefined,
    });
    expect(result).toEqual({ contextualGoalView: mockContextualView });
  });

  it("should pass note to command handler", async () => {
    const mockContextualView: ContextualGoalView = {
      goal: {
        goalId: "goal_456",
        objective: "Another objective",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
        status: "doing",
        version: 4,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T03:00:00Z",
        progress: [],
      },
      context: {
        components: [],
        dependencies: [],
        decisions: [],
        invariants: [],
        guidelines: [],
      },
    };
    mockCommandHandler.execute.mockResolvedValue(mockContextualView);

    await gateway.resumeGoal({
      goalId: "goal_456",
      note: "Ready to continue",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_456",
      note: "Ready to continue",
    });
  });

  it("should propagate command handler errors", async () => {
    mockCommandHandler.execute.mockRejectedValue(new Error("Goal not found: nonexistent"));

    await expect(
      gateway.resumeGoal({ goalId: "nonexistent" })
    ).rejects.toThrow("Goal not found: nonexistent");
  });
});
