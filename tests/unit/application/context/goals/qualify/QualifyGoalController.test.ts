/**
 * Tests for QualifyGoalController
 *
 * Verifies the controller delegates to the gateway interface.
 */

import { QualifyGoalController } from "../../../../../../src/application/context/goals/qualify/QualifyGoalController";
import { IQualifyGoalGateway } from "../../../../../../src/application/context/goals/qualify/IQualifyGoalGateway";
import { QualifyGoalRequest } from "../../../../../../src/application/context/goals/qualify/QualifyGoalRequest";
import { QualifyGoalResponse } from "../../../../../../src/application/context/goals/qualify/QualifyGoalResponse";
import { GoalStatus } from "../../../../../../src/domain/goals/Constants";
import { jest } from "@jest/globals";

describe("QualifyGoalController", () => {
  let gateway: jest.Mocked<IQualifyGoalGateway>;
  let controller: QualifyGoalController;

  beforeEach(() => {
    gateway = {
      qualifyGoal: jest.fn(),
    };
    controller = new QualifyGoalController(gateway);
  });

  describe("handle", () => {
    it("delegates to gateway and returns response", async () => {
      const request: QualifyGoalRequest = { goalId: "goal_123" };
      const expectedResponse: QualifyGoalResponse = {
        goalId: "goal_123",
        objective: "Test objective",
        status: GoalStatus.QUALIFIED,
        nextGoalId: "goal_456",
      };

      gateway.qualifyGoal.mockResolvedValue(expectedResponse);

      const response = await controller.handle(request);

      expect(gateway.qualifyGoal).toHaveBeenCalledWith(request);
      expect(response).toBe(expectedResponse);
    });

    it("propagates errors from gateway", async () => {
      const request: QualifyGoalRequest = { goalId: "goal_123" };
      const error = new Error("Gateway error");

      gateway.qualifyGoal.mockRejectedValue(error);

      await expect(controller.handle(request)).rejects.toThrow("Gateway error");
    });
  });
});
