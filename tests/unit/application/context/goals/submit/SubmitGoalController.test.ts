/**
 * Tests for SubmitGoalController
 *
 * Verifies the controller delegates to the gateway interface.
 */

import { SubmitGoalController } from "../../../../../../src/application/context/goals/submit/SubmitGoalController";
import { ISubmitGoalGateway } from "../../../../../../src/application/context/goals/submit/ISubmitGoalGateway";
import { SubmitGoalRequest } from "../../../../../../src/application/context/goals/submit/SubmitGoalRequest";
import { SubmitGoalResponse } from "../../../../../../src/application/context/goals/submit/SubmitGoalResponse";
import { jest } from "@jest/globals";

describe("SubmitGoalController", () => {
  let gateway: jest.Mocked<ISubmitGoalGateway>;
  let controller: SubmitGoalController;

  beforeEach(() => {
    gateway = {
      submitGoal: jest.fn(),
    };
    controller = new SubmitGoalController(gateway);
  });

  describe("handle", () => {
    it("delegates to gateway and returns response", async () => {
      const request: SubmitGoalRequest = { goalId: "goal_123" };
      const expectedResponse: SubmitGoalResponse = {
        goalId: "goal_123",
        status: "submitted",
        objective: "Implement feature",
      };

      gateway.submitGoal.mockResolvedValue(expectedResponse);

      const response = await controller.handle(request);

      expect(gateway.submitGoal).toHaveBeenCalledWith(request);
      expect(response).toBe(expectedResponse);
    });

    it("propagates errors from gateway", async () => {
      const request: SubmitGoalRequest = { goalId: "goal_123" };
      const error = new Error("Gateway error");

      gateway.submitGoal.mockRejectedValue(error);

      await expect(controller.handle(request)).rejects.toThrow("Gateway error");
    });
  });
});
