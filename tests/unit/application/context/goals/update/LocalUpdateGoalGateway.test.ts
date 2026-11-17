/**
 * Tests for LocalUpdateGoalGateway
 * Verifies gateway delegates to command handler correctly.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { LocalUpdateGoalGateway } from "../../../../../../src/application/context/goals/update/LocalUpdateGoalGateway";
import { UpdateGoalCommandHandler } from "../../../../../../src/application/context/goals/update/UpdateGoalCommandHandler";

describe("LocalUpdateGoalGateway", () => {
  let gateway: LocalUpdateGoalGateway;
  let mockCommandHandler: jest.Mocked<Pick<UpdateGoalCommandHandler, "execute">>;

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn<UpdateGoalCommandHandler["execute"]>(),
    };
    gateway = new LocalUpdateGoalGateway(
      mockCommandHandler as unknown as UpdateGoalCommandHandler
    );
  });

  it("should execute command with all fields and return goalId", async () => {
    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_123" });

    const result = await gateway.updateGoal({
      goalId: "goal_123",
      title: "Updated title",
      objective: "Updated objective",
      successCriteria: ["criterion1"],
      scopeIn: ["component A"],
      scopeOut: ["component B"],
      nextGoalId: "goal_456",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
      title: "Updated title",
      objective: "Updated objective",
      successCriteria: ["criterion1"],
      scopeIn: ["component A"],
      scopeOut: ["component B"],
      nextGoalId: "goal_456",
      prerequisiteGoals: undefined,
    });
    expect(result).toEqual({ goalId: "goal_123" });
  });

  it("should execute command with partial fields", async () => {
    mockCommandHandler.execute.mockResolvedValue({ goalId: "goal_123" });

    const result = await gateway.updateGoal({
      goalId: "goal_123",
      objective: "Only objective",
    });

    expect(mockCommandHandler.execute).toHaveBeenCalledWith({
      goalId: "goal_123",
      title: undefined,
      objective: "Only objective",
      successCriteria: undefined,
      scopeIn: undefined,
      scopeOut: undefined,
      nextGoalId: undefined,
      prerequisiteGoals: undefined,
    });
    expect(result).toEqual({ goalId: "goal_123" });
  });

  it("should propagate command handler errors", async () => {
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Goal not found: goal_999")
    );

    await expect(
      gateway.updateGoal({ goalId: "goal_999" })
    ).rejects.toThrow("Goal not found: goal_999");
  });
});
