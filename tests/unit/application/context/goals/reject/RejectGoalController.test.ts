/**
 * Tests for RejectGoalController
 */

import { RejectGoalController } from "../../../../../../src/application/context/goals/reject/RejectGoalController";
import { IRejectGoalGateway } from "../../../../../../src/application/context/goals/reject/IRejectGoalGateway";
import { RejectGoalResponse } from "../../../../../../src/application/context/goals/reject/RejectGoalResponse";
import { jest } from "@jest/globals";

describe("RejectGoalController", () => {
  let gateway: IRejectGoalGateway;
  let controller: RejectGoalController;

  beforeEach(() => {
    gateway = {
      rejectGoal: jest.fn(),
    };

    controller = new RejectGoalController(gateway);
  });

  it("should delegate to gateway and return response", async () => {
    const mockResponse: RejectGoalResponse = {
      goalId: "goal_123",
      status: "rejected",
      objective: "Test objective",
      reviewIssues: "Missing error handling",
    };
    (gateway.rejectGoal as jest.Mock).mockResolvedValue(mockResponse);

    const result = await controller.handle({
      goalId: "goal_123",
      reviewIssues: "Missing error handling",
    });

    expect(result).toEqual(mockResponse);
    expect(gateway.rejectGoal).toHaveBeenCalledWith({
      goalId: "goal_123",
      reviewIssues: "Missing error handling",
    });
  });

  it("should propagate gateway errors", async () => {
    (gateway.rejectGoal as jest.Mock).mockRejectedValue(
      new Error("Gateway failure")
    );

    await expect(
      controller.handle({
        goalId: "goal_123",
        reviewIssues: "Some findings",
      })
    ).rejects.toThrow("Gateway failure");
  });
});
