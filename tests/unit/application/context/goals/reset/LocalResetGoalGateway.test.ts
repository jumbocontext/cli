import { LocalResetGoalGateway } from "../../../../../../src/application/context/goals/reset/LocalResetGoalGateway";
import { ResetGoalCommandHandler } from "../../../../../../src/application/context/goals/reset/ResetGoalCommandHandler";
import { IGoalResetReader } from "../../../../../../src/application/context/goals/reset/IGoalResetReader";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("LocalResetGoalGateway", () => {
  let gateway: LocalResetGoalGateway;
  let mockCommandHandler: jest.Mocked<ResetGoalCommandHandler>;
  let mockGoalReader: jest.Mocked<IGoalResetReader>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ResetGoalCommandHandler>;

    mockGoalReader = {
      findById: jest.fn(),
    } as jest.Mocked<IGoalResetReader>;

    gateway = new LocalResetGoalGateway(
      mockCommandHandler,
      mockGoalReader
    );
  });

  it("resets a goal successfully", async () => {
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Goal to reset",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };

    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_456" });
    mockGoalReader.findById.mockResolvedValue(mockView);

    const response = await gateway.resetGoal({ goalId: "goal_456" });

    expect(response.goalId).toBe("goal_456");
    expect(response.objective).toBe("Goal to reset");
    expect(response.status).toBe(GoalStatus.TODO);
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_456" });
    expect(mockGoalReader.findById).toHaveBeenCalledWith("goal_456");
  });

  it("falls back to goalId when view is not found", async () => {
    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_789" });
    mockGoalReader.findById.mockResolvedValue(null);

    const response = await gateway.resetGoal({ goalId: "goal_789" });

    expect(response.goalId).toBe("goal_789");
    expect(response.objective).toBe("goal_789");
    expect(response.status).toBe("defined");
  });

  it("propagates errors from command handler", async () => {
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Goal not found: goal_456")
    );

    await expect(
      gateway.resetGoal({ goalId: "goal_456" })
    ).rejects.toThrow("Goal not found: goal_456");
  });
});
