import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AddGoalController } from "../../../../../../src/application/context/goals/add/AddGoalController.js";
import { IAddGoalGateway } from "../../../../../../src/application/context/goals/add/IAddGoalGateway.js";

describe("AddGoalController", () => {
  let controller: AddGoalController;
  let mockGateway: jest.Mocked<IAddGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      addGoal: jest.fn(),
    } as jest.Mocked<IAddGoalGateway>;

    controller = new AddGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      title: "Auth feature",
      objective: "Implement authentication",
      successCriteria: ["Users can log in", "Token validation works"],
      scopeIn: ["AuthController"],
      scopeOut: ["AdminPanel"],
      nextGoalId: "goal_next",
      previousGoalId: "goal_prev",
    };

    const expectedResponse = {
      goalId: "goal_123",
    };

    mockGateway.addGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addGoal).toHaveBeenCalledWith(request);
  });

  it("should handle request with only required fields", async () => {
    const request = {
      title: "Bug fix",
      objective: "Fix bug #123",
      successCriteria: ["Bug is resolved"],
    };

    const expectedResponse = {
      goalId: "goal_456",
    };

    mockGateway.addGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.addGoal).toHaveBeenCalledWith(request);
  });
});
