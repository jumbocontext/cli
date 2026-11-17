/**
 * Tests for UpdateGoalController
 * Verifies controller delegates to gateway correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { UpdateGoalController } from "../../../../../../src/application/context/goals/update/UpdateGoalController";
import { IUpdateGoalGateway } from "../../../../../../src/application/context/goals/update/IUpdateGoalGateway";
import { UpdateGoalRequest } from "../../../../../../src/application/context/goals/update/UpdateGoalRequest";
import { UpdateGoalResponse } from "../../../../../../src/application/context/goals/update/UpdateGoalResponse";

describe("UpdateGoalController", () => {
  let controller: UpdateGoalController;
  let mockGateway: jest.Mocked<IUpdateGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      updateGoal: jest.fn<IUpdateGoalGateway["updateGoal"]>(),
    };
    controller = new UpdateGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request: UpdateGoalRequest = {
      goalId: "goal_123",
      title: "Updated title",
      objective: "Updated objective",
      successCriteria: ["criterion1", "criterion2"],
      scopeIn: ["component A"],
      scopeOut: ["component B"],
      nextGoalId: "goal_456",
    };
    const expectedResponse: UpdateGoalResponse = {
      goalId: "goal_123",
    };
    mockGateway.updateGoal.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(mockGateway.updateGoal).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should delegate partial updates to gateway", async () => {
    const request: UpdateGoalRequest = {
      goalId: "goal_123",
      objective: "Only updating objective",
    };
    const expectedResponse: UpdateGoalResponse = {
      goalId: "goal_123",
    };
    mockGateway.updateGoal.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(mockGateway.updateGoal).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should propagate gateway errors", async () => {
    const request: UpdateGoalRequest = {
      goalId: "goal_999",
    };
    mockGateway.updateGoal.mockRejectedValue(new Error("Goal not found"));

    await expect(controller.handle(request)).rejects.toThrow("Goal not found");
  });
});
