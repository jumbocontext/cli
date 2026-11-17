import { LocalSubmitGoalGateway } from "../../../../../../src/application/context/goals/submit/LocalSubmitGoalGateway";
import { SubmitGoalCommandHandler } from "../../../../../../src/application/context/goals/submit/SubmitGoalCommandHandler";
import { jest } from "@jest/globals";

describe("LocalSubmitGoalGateway", () => {
  let gateway: LocalSubmitGoalGateway;
  let mockCommandHandler: jest.Mocked<Pick<SubmitGoalCommandHandler, "execute">>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    };

    gateway = new LocalSubmitGoalGateway(
      mockCommandHandler as unknown as SubmitGoalCommandHandler
    );
  });

  it("should delegate to command handler and map response", async () => {
    const contextualGoalView = {
      goal: {
        goalId: "goal_123",
        objective: "Implement feature",
        status: "submitted",
        version: 4,
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

    const response = await gateway.submitGoal({ goalId: "goal_123" });

    expect(response).toEqual({
      goalId: "goal_123",
      status: "submitted",
      objective: "Implement feature",
    });
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_123" });
  });

  it("should propagate command handler errors", async () => {
    mockCommandHandler.execute.mockRejectedValue(new Error("Goal not found"));

    await expect(gateway.submitGoal({ goalId: "goal_123" })).rejects.toThrow("Goal not found");
  });
});
