import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BlockGoalController } from "../../../../../../src/application/context/goals/block/BlockGoalController.js";
import { IBlockGoalGateway } from "../../../../../../src/application/context/goals/block/IBlockGoalGateway.js";

describe("BlockGoalController", () => {
  let controller: BlockGoalController;
  let mockGateway: jest.Mocked<IBlockGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      blockGoal: jest.fn(),
    } as jest.Mocked<IBlockGoalGateway>;

    controller = new BlockGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      goalId: "goal_123",
      note: "Waiting for API credentials",
    };

    const expectedResponse = {
      goalId: "goal_123",
      note: "Waiting for API credentials",
    };

    mockGateway.blockGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.blockGoal).toHaveBeenCalledWith(request);
  });
});
