import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UnblockGoalController } from "../../../../../../src/application/context/goals/unblock/UnblockGoalController.js";
import { IUnblockGoalGateway } from "../../../../../../src/application/context/goals/unblock/IUnblockGoalGateway.js";

describe("UnblockGoalController", () => {
  let controller: UnblockGoalController;
  let mockGateway: jest.Mocked<IUnblockGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      unblockGoal: jest.fn(),
    } as jest.Mocked<IUnblockGoalGateway>;

    controller = new UnblockGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      goalId: "goal_123",
      note: "API credentials received",
    };

    const expectedResponse = {
      goalId: "goal_123",
      note: "API credentials received",
    };

    mockGateway.unblockGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.unblockGoal).toHaveBeenCalledWith(request);
  });

  it("should delegate to gateway without note", async () => {
    const request = {
      goalId: "goal_456",
    };

    const expectedResponse = {
      goalId: "goal_456",
    };

    mockGateway.unblockGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.unblockGoal).toHaveBeenCalledWith(request);
  });
});
