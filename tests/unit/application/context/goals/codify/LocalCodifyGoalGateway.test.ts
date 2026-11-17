/**
 * Tests for LocalCodifyGoalGateway
 * Verifies gateway delegates to command handler correctly.
 */

import { LocalCodifyGoalGateway } from "../../../../../../src/application/context/goals/codify/LocalCodifyGoalGateway";
import { CodifyGoalCommandHandler } from "../../../../../../src/application/context/goals/codify/CodifyGoalCommandHandler";
import { ContextualGoalView } from "../../../../../../src/application/context/goals/get/ContextualGoalView";
import { jest } from "@jest/globals";

describe("LocalCodifyGoalGateway", () => {
  let gateway: LocalCodifyGoalGateway;
  let mockCommandHandler: jest.Mocked<Pick<CodifyGoalCommandHandler, "execute">>;

  const mockContextualGoalView: ContextualGoalView = {
    goal: {
      goalId: "goal_123",
      objective: "Test objective",
      status: "codifying",
      successCriteria: ["criterion1"],
      scopeIn: [],
      scopeOut: [],
      version: 8,
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
      execute: jest.fn<CodifyGoalCommandHandler["execute"]>(),
    };
    gateway = new LocalCodifyGoalGateway(
      mockCommandHandler as unknown as CodifyGoalCommandHandler
    );
  });

  it("should execute command and return contextual goal view", async () => {
    mockCommandHandler.execute.mockResolvedValue(mockContextualGoalView);

    const result = await gateway.codifyGoal({ goalId: "goal_123" });

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
      gateway.codifyGoal({ goalId: "goal_999" })
    ).rejects.toThrow("Goal not found: goal_999");
  });
});
