import { LocalCommitGoalGateway } from "../../../../../../src/application/context/goals/commit/LocalCommitGoalGateway";
import { CommitGoalCommandHandler } from "../../../../../../src/application/context/goals/commit/CommitGoalCommandHandler";
import { jest } from "@jest/globals";

describe("LocalCommitGoalGateway", () => {
  let gateway: LocalCommitGoalGateway;
  let mockCommandHandler: jest.Mocked<Pick<CommitGoalCommandHandler, "execute">>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    };

    gateway = new LocalCommitGoalGateway(
      mockCommandHandler as unknown as CommitGoalCommandHandler
    );
  });

  it("should delegate to command handler and map response", async () => {
    const contextualGoalView = {
      goal: {
        goalId: "goal_123",
        objective: "Implement feature",
        status: "refined",
        version: 3,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T11:00:00Z",
        successCriteria: [],
        scopeIn: [],
        scopeOut: [],
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

    mockCommandHandler.execute.mockResolvedValue(contextualGoalView);

    const response = await gateway.commitGoal({ goalId: "goal_123" });

    expect(response).toEqual({
      goalId: "goal_123",
      status: "refined",
    });
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_123" });
  });

  it("should propagate command handler errors", async () => {
    mockCommandHandler.execute.mockRejectedValue(new Error("Goal not found"));

    await expect(gateway.commitGoal({ goalId: "goal_123" })).rejects.toThrow("Goal not found");
  });
});
