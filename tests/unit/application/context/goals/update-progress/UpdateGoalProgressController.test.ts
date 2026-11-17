/**
 * Tests for UpdateGoalProgressController
 * Verifies controller delegates to gateway correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { UpdateGoalProgressController } from "../../../../../../src/application/context/goals/update-progress/UpdateGoalProgressController";
import { IUpdateGoalProgressGateway } from "../../../../../../src/application/context/goals/update-progress/IUpdateGoalProgressGateway";
import { UpdateGoalProgressRequest } from "../../../../../../src/application/context/goals/update-progress/UpdateGoalProgressRequest";
import { UpdateGoalProgressResponse } from "../../../../../../src/application/context/goals/update-progress/UpdateGoalProgressResponse";

describe("UpdateGoalProgressController", () => {
  let controller: UpdateGoalProgressController;
  let mockGateway: jest.Mocked<IUpdateGoalProgressGateway>;

  beforeEach(() => {
    mockGateway = {
      updateGoalProgress: jest.fn<IUpdateGoalProgressGateway["updateGoalProgress"]>(),
    };
    controller = new UpdateGoalProgressController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request: UpdateGoalProgressRequest = {
      goalId: "goal_123",
      taskDescription: "Implemented user login form",
    };
    const expectedResponse: UpdateGoalProgressResponse = {
      goalContextView: {
        goal: {
          goalId: "goal_123",
          objective: "Test objective",
          status: "doing",
          successCriteria: ["criterion1"],
          scopeIn: [],
          scopeOut: [],
          version: 2,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
          progress: ["Implemented user login form"],
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
    mockGateway.updateGoalProgress.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(mockGateway.updateGoalProgress).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should propagate gateway errors", async () => {
    const request: UpdateGoalProgressRequest = {
      goalId: "goal_123",
      taskDescription: "Some task",
    };
    mockGateway.updateGoalProgress.mockRejectedValue(new Error("Goal not found"));

    await expect(controller.handle(request)).rejects.toThrow("Goal not found");
  });
});
