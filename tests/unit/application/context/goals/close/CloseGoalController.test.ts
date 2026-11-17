import { CloseGoalController } from "../../../../../../src/application/context/goals/close/CloseGoalController";
import { ICloseGoalGateway } from "../../../../../../src/application/context/goals/close/ICloseGoalGateway";
import { jest } from "@jest/globals";

describe("CloseGoalController", () => {
  let controller: CloseGoalController;
  let mockGateway: jest.Mocked<ICloseGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      closeGoal: jest.fn(),
    } as jest.Mocked<ICloseGoalGateway>;

    controller = new CloseGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      goalId: "goal_123",
    };

    const expectedResponse = {
      goalId: "goal_123",
      objective: "Close the goal",
      status: "done",
    };

    mockGateway.closeGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.closeGoal).toHaveBeenCalledWith(request);
  });
});
