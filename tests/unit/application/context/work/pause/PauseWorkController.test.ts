import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PauseWorkController } from "../../../../../../src/application/context/work/pause/PauseWorkController";
import { IPauseWorkGateway } from "../../../../../../src/application/context/work/pause/IPauseWorkGateway";

describe("PauseWorkController", () => {
  let controller: PauseWorkController;
  let mockGateway: jest.Mocked<IPauseWorkGateway>;

  beforeEach(() => {
    mockGateway = {
      pauseWork: jest.fn(),
    } as jest.Mocked<IPauseWorkGateway>;

    controller = new PauseWorkController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockResponse = {
      goalId: "goal_123",
      objective: "Implement feature",
    };

    mockGateway.pauseWork.mockResolvedValue(mockResponse);

    const response = await controller.handle({});

    expect(response).toEqual(mockResponse);
    expect(mockGateway.pauseWork).toHaveBeenCalledWith({});
  });

  it("should propagate errors from gateway", async () => {
    mockGateway.pauseWork.mockRejectedValue(
      new Error("No active goal found for current worker")
    );

    await expect(controller.handle({})).rejects.toThrow(
      "No active goal found for current worker"
    );
  });
});
