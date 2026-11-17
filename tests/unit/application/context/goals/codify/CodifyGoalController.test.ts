/**
 * Tests for CodifyGoalController
 * Verifies controller delegates to gateway correctly.
 */

import { CodifyGoalController } from "../../../../../../src/application/context/goals/codify/CodifyGoalController";
import { ICodifyGoalGateway } from "../../../../../../src/application/context/goals/codify/ICodifyGoalGateway";
import { CodifyGoalRequest } from "../../../../../../src/application/context/goals/codify/CodifyGoalRequest";
import { CodifyGoalResponse } from "../../../../../../src/application/context/goals/codify/CodifyGoalResponse";
import { jest } from "@jest/globals";

describe("CodifyGoalController", () => {
  let controller: CodifyGoalController;
  let mockGateway: jest.Mocked<ICodifyGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      codifyGoal: jest.fn<ICodifyGoalGateway["codifyGoal"]>(),
    };
    controller = new CodifyGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request: CodifyGoalRequest = {
      goalId: "goal_123",
    };
    const expectedResponse: CodifyGoalResponse = {
      goalContextView: {
        goal: {
          goalId: "goal_123",
          objective: "Test objective",
          status: "codifying",
          successCriteria: ["criterion1"],
          scopeIn: [],
          scopeOut: [],
          version: 8,
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
    mockGateway.codifyGoal.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(mockGateway.codifyGoal).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should propagate gateway errors", async () => {
    const request: CodifyGoalRequest = {
      goalId: "goal_123",
    };
    mockGateway.codifyGoal.mockRejectedValue(new Error("Goal not found"));

    await expect(controller.handle(request)).rejects.toThrow("Goal not found");
  });
});
