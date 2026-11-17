/**
 * Tests for LocalUpdateGoalProgressGateway
 * Verifies gateway delegates to command handler correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { LocalUpdateGoalProgressGateway } from "../../../../../../src/application/context/goals/update-progress/LocalUpdateGoalProgressGateway";
import { UpdateGoalProgressCommandHandler } from "../../../../../../src/application/context/goals/update-progress/UpdateGoalProgressCommandHandler";
import { ContextualGoalView } from "../../../../../../src/application/context/goals/get/ContextualGoalView";

describe("LocalUpdateGoalProgressGateway", () => {
  let gateway: LocalUpdateGoalProgressGateway;
  let mockCommandHandler: jest.Mocked<Pick<UpdateGoalProgressCommandHandler, "execute">>;

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
      progress: ["Implemented user login form"],
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
      execute: jest.fn<UpdateGoalProgressCommandHandler["execute"]>(),
    };
    gateway = new LocalUpdateGoalProgressGateway(
      mockCommandHandler as unknown as UpdateGoalProgressCommandHandler
    );
  });

  it("should execute command and return contextual goal view", async () => {
    mockCommandHandler.execute.mockResolvedValue(mockContextualGoalView);

    const result = await gateway.updateGoalProgress({
      goalId: "goal_123",
      taskDescription: "Implemented user login form",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
      taskDescription: "Implemented user login form",
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
      gateway.updateGoalProgress({ goalId: "goal_999", taskDescription: "Some task" })
    ).rejects.toThrow("Goal not found: goal_999");
  });
});
