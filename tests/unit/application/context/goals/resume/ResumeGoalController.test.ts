/**
 * Tests for ResumeGoalController
 * Verifies controller delegates to gateway correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { ResumeGoalController } from "../../../../../../src/application/context/goals/resume/ResumeGoalController";
import { IResumeGoalGateway } from "../../../../../../src/application/context/goals/resume/IResumeGoalGateway";
import { ResumeGoalRequest } from "../../../../../../src/application/context/goals/resume/ResumeGoalRequest";
import { ResumeGoalResponse } from "../../../../../../src/application/context/goals/resume/ResumeGoalResponse";

describe("ResumeGoalController", () => {
  let controller: ResumeGoalController;
  let mockGateway: jest.Mocked<IResumeGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      resumeGoal: jest.fn<IResumeGoalGateway["resumeGoal"]>(),
    };
    controller = new ResumeGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request: ResumeGoalRequest = {
      goalId: "goal_123",
    };
    const expectedResponse: ResumeGoalResponse = {
      contextualGoalView: {
        goal: {
          goalId: "goal_123",
          objective: "Test objective",
          successCriteria: ["Criterion"],
          scopeIn: [],
          scopeOut: [],
          status: "doing",
          version: 4,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T03:00:00Z",
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
    mockGateway.resumeGoal.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(mockGateway.resumeGoal).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should pass optional note to gateway", async () => {
    const request: ResumeGoalRequest = {
      goalId: "goal_123",
      note: "Ready to continue",
    };
    const expectedResponse: ResumeGoalResponse = {
      contextualGoalView: {
        goal: {
          goalId: "goal_123",
          objective: "Test objective",
          successCriteria: [],
          scopeIn: [],
          scopeOut: [],
          status: "doing",
          version: 4,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T03:00:00Z",
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
    mockGateway.resumeGoal.mockResolvedValue(expectedResponse);

    const result = await controller.handle(request);

    expect(mockGateway.resumeGoal).toHaveBeenCalledWith(request);
    expect(result).toEqual(expectedResponse);
  });

  it("should propagate gateway errors", async () => {
    const request: ResumeGoalRequest = {
      goalId: "goal_123",
    };
    mockGateway.resumeGoal.mockRejectedValue(new Error("Goal not found"));

    await expect(controller.handle(request)).rejects.toThrow("Goal not found");
  });
});
