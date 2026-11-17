import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalShowGoalGateway } from "../../../../../../src/application/context/goals/get/LocalShowGoalGateway.js";
import { GoalContextQueryHandler } from "../../../../../../src/application/context/goals/get/GoalContextQueryHandler.js";
import { ContextualGoalView } from "../../../../../../src/application/context/goals/get/ContextualGoalView.js";

describe("LocalShowGoalGateway", () => {
  let gateway: LocalShowGoalGateway;
  let mockQueryHandler: jest.Mocked<GoalContextQueryHandler>;

  beforeEach(() => {
    mockQueryHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GoalContextQueryHandler>;

    gateway = new LocalShowGoalGateway(mockQueryHandler);
  });

  it("should delegate to GoalContextQueryHandler and return contextual view", async () => {
    const mockView: ContextualGoalView = {
      goal: {
        goalId: "goal_123",
        title: "Build feature",
        objective: "Build feature",
        successCriteria: ["Criteria 1"],
        scopeIn: ["Scope 1"],
        scopeOut: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
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

    mockQueryHandler.execute.mockResolvedValue(mockView);

    const response = await gateway.showGoal({ goalId: "goal_123" });

    expect(response.contextualGoalView).toEqual(mockView);
    expect(mockQueryHandler.execute).toHaveBeenCalledWith("goal_123");
  });

  it("should propagate errors from query handler", async () => {
    mockQueryHandler.execute.mockRejectedValue(new Error("Goal not found: goal_999"));

    await expect(gateway.showGoal({ goalId: "goal_999" })).rejects.toThrow(
      "Goal not found: goal_999"
    );
  });
});
