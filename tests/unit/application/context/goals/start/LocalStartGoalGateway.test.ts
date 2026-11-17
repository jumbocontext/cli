/**
 * Tests for LocalStartGoalGateway
 * Verifies gateway delegates to command handler correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { LocalStartGoalGateway } from "../../../../../../src/application/context/goals/start/LocalStartGoalGateway";
import { StartGoalCommandHandler } from "../../../../../../src/application/context/goals/start/StartGoalCommandHandler";
import { ContextualGoalView } from "../../../../../../src/application/context/goals/get/ContextualGoalView";

describe("LocalStartGoalGateway", () => {
  let gateway: LocalStartGoalGateway;
  let mockCommandHandler: jest.Mocked<Pick<StartGoalCommandHandler, "execute">>;

  const mockContextualGoalView: ContextualGoalView = {
    goal: {
      goalId: "goal_123",
      objective: "Test objective",
      status: "doing",
      successCriteria: ["criterion1"],
      scopeIn: [],
      scopeOut: [],
      version: 2,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
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

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn<StartGoalCommandHandler["execute"]>(),
    };
    gateway = new LocalStartGoalGateway(
      mockCommandHandler as unknown as StartGoalCommandHandler
    );
  });

  it("should execute command and return contextual goal view", async () => {
    mockCommandHandler.execute.mockResolvedValue(mockContextualGoalView);

    const result = await gateway.startGoal({ goalId: "goal_123" });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
    });
    expect(result).toEqual({
      goalContextView: mockContextualGoalView,
    });
  });

  it("should propagate command handler errors", async () => {
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Goal not found: goal_999")
    );

    await expect(
      gateway.startGoal({ goalId: "goal_999" })
    ).rejects.toThrow("Goal not found: goal_999");
  });
});
