import { LocalRemoveGoalGateway } from "../../../../../../src/application/context/goals/remove/LocalRemoveGoalGateway";
import { RemoveGoalCommandHandler } from "../../../../../../src/application/context/goals/remove/RemoveGoalCommandHandler";
import { IGoalRemoveReader } from "../../../../../../src/application/context/goals/remove/IGoalRemoveReader";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("LocalRemoveGoalGateway", () => {
  let gateway: LocalRemoveGoalGateway;
  let mockCommandHandler: jest.Mocked<RemoveGoalCommandHandler>;
  let mockGoalReader: jest.Mocked<IGoalRemoveReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RemoveGoalCommandHandler>;

    mockGoalReader = {
      findById: jest.fn(),
    } as jest.Mocked<IGoalRemoveReader>;

    gateway = new LocalRemoveGoalGateway(
      mockCommandHandler,
      mockGoalReader
    );
  });

  it("removes a goal successfully", async () => {
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Goal to remove",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };

    mockGoalReader.findById.mockResolvedValue(mockView);
    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_456" });

    const response = await gateway.removeGoal({ goalId: "goal_456" });

    expect(response.goalId).toBe("goal_456");
    expect(response.objective).toBe("Goal to remove");
    expect(mockGoalReader.findById).toHaveBeenCalledWith("goal_456");
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_456" });
  });

  it("falls back to goalId when view is not found", async () => {
    mockGoalReader.findById.mockResolvedValue(null);
    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_789" });

    const response = await gateway.removeGoal({ goalId: "goal_789" });

    expect(response.goalId).toBe("goal_789");
    expect(response.objective).toBe("goal_789");
  });

  it("propagates errors from command handler", async () => {
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Goal to remove",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };

    mockGoalReader.findById.mockResolvedValue(mockView);
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Goal not found: goal_456")
    );

    await expect(
      gateway.removeGoal({ goalId: "goal_456" })
    ).rejects.toThrow("Goal not found: goal_456");
  });
});
