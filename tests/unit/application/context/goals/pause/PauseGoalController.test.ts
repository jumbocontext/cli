/**
 * Tests for PauseGoalController
 * Verifies controller delegates to gateway correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { PauseGoalController } from "../../../../../../src/application/context/goals/pause/PauseGoalController";
import { IPauseGoalGateway } from "../../../../../../src/application/context/goals/pause/IPauseGoalGateway";
import { PauseGoalRequest } from "../../../../../../src/application/context/goals/pause/PauseGoalRequest";
import { PauseGoalResponse } from "../../../../../../src/application/context/goals/pause/PauseGoalResponse";

describe("PauseGoalController", () => {
  let controller: PauseGoalController;
  let mockGateway: jest.Mocked<IPauseGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      pauseGoal: jest.fn<IPauseGoalGateway["pauseGoal"]>(),
    };
    controller = new PauseGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request: PauseGoalRequest = {
      goalId: "goal_123",
      reason: "WorkPaused",
    };
    const expectedResponse: PauseGoalResponse = {
      goalId: "goal_123",
      objective: "Test objective",
      status: "paused",
      reason: "WorkPaused",
    };
    mockGateway.pauseGoal.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(mockGateway.pauseGoal).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should propagate gateway errors", async () => {
    const request: PauseGoalRequest = {
      goalId: "goal_123",
      reason: "Other",
      note: "Some note",
    };
    mockGateway.pauseGoal.mockRejectedValue(new Error("Goal not found"));

    await expect(controller.handle(request)).rejects.toThrow("Goal not found");
  });
});
