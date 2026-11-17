import { RefineGoalController } from "../../../../../../src/application/context/goals/refine/RefineGoalController";
import { IRefineGoalGateway } from "../../../../../../src/application/context/goals/refine/IRefineGoalGateway";
import { jest } from "@jest/globals";

describe("RefineGoalController", () => {
  let controller: RefineGoalController;
  let mockGateway: jest.Mocked<IRefineGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      refineGoal: jest.fn(),
    } as jest.Mocked<IRefineGoalGateway>;

    controller = new RefineGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = { goalId: "goal_123" };
    const expectedResponse = {
      goalId: "goal_123",
      status: "refined",
    };

    mockGateway.refineGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.refineGoal).toHaveBeenCalledWith(request);
  });

  it("should propagate gateway errors", async () => {
    const request = { goalId: "goal_123" };
    mockGateway.refineGoal.mockRejectedValue(new Error("Gateway failure"));

    await expect(controller.handle(request)).rejects.toThrow("Gateway failure");
  });
});
