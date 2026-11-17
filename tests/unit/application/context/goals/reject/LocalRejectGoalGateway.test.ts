/**
 * Tests for LocalRejectGoalGateway
 */

import { LocalRejectGoalGateway } from "../../../../../../src/application/context/goals/reject/LocalRejectGoalGateway";
import { RejectGoalCommandHandler } from "../../../../../../src/application/context/goals/reject/RejectGoalCommandHandler";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("LocalRejectGoalGateway", () => {
  let commandHandler: RejectGoalCommandHandler;
  let gateway: LocalRejectGoalGateway;

  beforeEach(() => {
    commandHandler = {
      execute: jest.fn(),
    } as unknown as RejectGoalCommandHandler;

    gateway = new LocalRejectGoalGateway(commandHandler);
  });

  it("should delegate to command handler and return response", async () => {
    const mockContextualView = {
      goal: {
        goalId: "goal_123",
        status: GoalStatus.REJECTED,
        objective: "Test objective",
        nextGoalId: "goal_456",
      },
      context: {
        components: [],
        dependencies: [],
        decisions: [],
        invariants: [],
        guidelines: [],
      },
    };
    (commandHandler.execute as jest.Mock).mockResolvedValue(mockContextualView);

    const result = await gateway.rejectGoal({
      goalId: "goal_123",
      reviewIssues: "Missing error handling",
    });

    expect(result.goalId).toBe("goal_123");
    expect(result.status).toBe(GoalStatus.REJECTED);
    expect(result.objective).toBe("Test objective");
    expect(result.reviewIssues).toBe("Missing error handling");
    expect(result.nextGoalId).toBe("goal_456");

    expect(commandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
      reviewIssues: "Missing error handling",
    });
  });

  it("should propagate command handler errors", async () => {
    (commandHandler.execute as jest.Mock).mockRejectedValue(
      new Error("Handler failure")
    );

    await expect(
      gateway.rejectGoal({
        goalId: "goal_123",
        reviewIssues: "Some findings",
      })
    ).rejects.toThrow("Handler failure");
  });
});
