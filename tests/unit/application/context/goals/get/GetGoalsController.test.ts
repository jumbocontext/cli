import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { GetGoalsController } from "../../../../../../src/application/context/goals/get/GetGoalsController.js";
import { IGetGoalsGateway } from "../../../../../../src/application/context/goals/get/IGetGoalsGateway.js";
import { GoalView } from "../../../../../../src/application/context/goals/GoalView.js";

describe("GetGoalsController", () => {
  let controller: GetGoalsController;
  let mockGateway: jest.Mocked<IGetGoalsGateway>;

  beforeEach(() => {
    mockGateway = {
      getGoals: jest.fn(),
    } as jest.Mocked<IGetGoalsGateway>;

    controller = new GetGoalsController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockGoals: GoalView[] = [
      {
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
    ];

    mockGateway.getGoals.mockResolvedValue({ goals: mockGoals });

    const response = await controller.handle({ statuses: ["doing"] });

    expect(response.goals).toEqual(mockGoals);
    expect(mockGateway.getGoals).toHaveBeenCalledWith({ statuses: ["doing"] });
  });

  it("should pass request without statuses through to gateway", async () => {
    mockGateway.getGoals.mockResolvedValue({ goals: [] });

    await controller.handle({});

    expect(mockGateway.getGoals).toHaveBeenCalledWith({});
  });
});
