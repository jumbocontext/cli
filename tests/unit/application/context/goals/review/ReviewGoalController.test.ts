/**
 * Tests for ReviewGoalController
 *
 * Verifies the controller delegates to the gateway interface.
 */

import { ReviewGoalController } from "../../../../../../src/application/context/goals/review/ReviewGoalController";
import { IReviewGoalGateway } from "../../../../../../src/application/context/goals/review/IReviewGoalGateway";
import { ReviewGoalRequest } from "../../../../../../src/application/context/goals/review/ReviewGoalRequest";
import { ReviewGoalResponse } from "../../../../../../src/application/context/goals/review/ReviewGoalResponse";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("ReviewGoalController", () => {
  let gateway: jest.Mocked<IReviewGoalGateway>;
  let controller: ReviewGoalController;

  beforeEach(() => {
    gateway = {
      reviewGoal: jest.fn(),
    };
    controller = new ReviewGoalController(gateway);
  });

  describe("handle", () => {
    it("delegates to gateway and returns response", async () => {
      const request: ReviewGoalRequest = { goalId: "goal_123" };
      const expectedResponse: ReviewGoalResponse = {
        goalId: "goal_123",
        objective: "Test objective",
        status: GoalStatus.INREVIEW,
        criteria: {
          goal: {
            goalId: "goal_123",
            objective: "Test objective",
            successCriteria: ["Criteria 1"],
            scopeIn: [],
            scopeOut: [],
            status: GoalStatus.INREVIEW,
            version: 2,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
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

      gateway.reviewGoal.mockResolvedValue(expectedResponse);

      const response = await controller.handle(request);

      expect(gateway.reviewGoal).toHaveBeenCalledWith(request);
      expect(response).toBe(expectedResponse);
    });

    it("propagates errors from gateway", async () => {
      const request: ReviewGoalRequest = { goalId: "goal_123" };
      const error = new Error("Gateway error");

      gateway.reviewGoal.mockRejectedValue(error);

      await expect(controller.handle(request)).rejects.toThrow("Gateway error");
    });
  });
});
