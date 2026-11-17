/**
 * Tests for StartGoalController
 * Verifies controller delegates to gateway correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { StartGoalController } from "../../../../../../src/application/context/goals/start/StartGoalController";
import { IStartGoalGateway } from "../../../../../../src/application/context/goals/start/IStartGoalGateway";
import { StartGoalRequest } from "../../../../../../src/application/context/goals/start/StartGoalRequest";
import { StartGoalResponse } from "../../../../../../src/application/context/goals/start/StartGoalResponse";

describe("StartGoalController", () => {
  let controller: StartGoalController;
  let mockGateway: jest.Mocked<IStartGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      startGoal: jest.fn<IStartGoalGateway["startGoal"]>(),
    };
    controller = new StartGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request: StartGoalRequest = {
      goalId: "goal_123",
    };
    const expectedResponse: StartGoalResponse = {
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
          progress: [],
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
    mockGateway.startGoal.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(mockGateway.startGoal).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should propagate gateway errors", async () => {
    const request: StartGoalRequest = {
      goalId: "goal_123",
    };
    mockGateway.startGoal.mockRejectedValue(new Error("Goal not found"));

    await expect(controller.handle(request)).rejects.toThrow("Goal not found");
  });
});
