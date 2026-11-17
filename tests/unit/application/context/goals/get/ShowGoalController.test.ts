import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ShowGoalController } from "../../../../../../src/application/context/goals/get/ShowGoalController.js";
import { IShowGoalGateway } from "../../../../../../src/application/context/goals/get/IShowGoalGateway.js";
import { ShowGoalResponse } from "../../../../../../src/application/context/goals/get/ShowGoalResponse.js";

describe("ShowGoalController", () => {
  let controller: ShowGoalController;
  let mockGateway: jest.Mocked<IShowGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      showGoal: jest.fn(),
    } as jest.Mocked<IShowGoalGateway>;

    controller = new ShowGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockResponse: ShowGoalResponse = {
      contextualGoalView: {
        goal: {
          goalId: "goal_123",
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
      },
    };

    mockGateway.showGoal.mockResolvedValue(mockResponse);

    const response = await controller.handle({ goalId: "goal_123" });

    expect(response).toEqual(mockResponse);
    expect(mockGateway.showGoal).toHaveBeenCalledWith({ goalId: "goal_123" });
  });

  it("should propagate gateway errors", async () => {
    mockGateway.showGoal.mockRejectedValue(new Error("Goal not found: goal_999"));

    await expect(controller.handle({ goalId: "goal_999" })).rejects.toThrow(
      "Goal not found: goal_999"
    );
  });
});
