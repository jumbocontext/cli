import { ResetGoalController } from "../../../../../../src/application/context/goals/reset/ResetGoalController";
import { IResetGoalGateway } from "../../../../../../src/application/context/goals/reset/IResetGoalGateway";
import { jest } from "@jest/globals";

describe("ResetGoalController", () => {
  let controller: ResetGoalController;
  let mockGateway: jest.Mocked<IResetGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      resetGoal: jest.fn(),
    } as jest.Mocked<IResetGoalGateway>;

    controller = new ResetGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      goalId: "goal_123",
    };

    const expectedResponse = {
      goalId: "goal_123",
      objective: "Reset this goal",
      status: "defined",
    };

    mockGateway.resetGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.resetGoal).toHaveBeenCalledWith(request);
  });
});
